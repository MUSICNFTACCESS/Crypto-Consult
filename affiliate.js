"use strict";

const crypto = require("crypto");

const REFERRAL_DAYS = 30;
const COMMISSION_RATE = 0.30;

function validReferralCode(code) {
  return typeof code === "string" &&
    /^[a-zA-Z0-9_-]{3,32}$/.test(code);
}

function normalizeReferralCode(code) {
  return String(code || "").trim().toLowerCase();
}

function calculateCommission(lamports) {
  return Math.floor(lamports * COMMISSION_RATE);
}

function createAffiliateSystem(db) {
  if (!db) {
    console.warn("Affiliate system disabled: Firebase unavailable.");
  }

  async function recordReferral(wallet, referralCode) {
    if (!db) return { success: false, error: "Database unavailable" };

    const code = normalizeReferralCode(referralCode);

    const approved = String(process.env.AFFILIATE_CODES || "")
      .split(",")
      .map(normalizeReferralCode)
      .filter(Boolean);

    if (!wallet || !validReferralCode(code) || !approved.includes(code)) {
      return { success: false, error: "Invalid or unapproved referral" };
    }

    const ref = db.collection("referrals").doc(wallet);

    await db.runTransaction(async transaction => {
      const existing = await transaction.get(ref);

      if (!existing.exists) {
        transaction.create(ref, {
          wallet,
          referralCode: code,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + REFERRAL_DAYS * 86400000
          ).toISOString(),
          converted: false
        });
      }
    });

    return { success: true };
  }

  async function getReferral(wallet) {
    if (!db || !wallet) return null;

    const snap = await db.collection("referrals").doc(wallet).get();
    return snap.exists ? snap.data() : null;
  }

  async function recordCommission(wallet, signature, lamports, paymentTimestamp) {
    if (!db || !wallet || !signature) return false;

    const referral = await getReferral(wallet);
    if (!referral || referral.converted) return false;

    // Only payments made within the referral attribution window qualify.

    const commission = calculateCommission(lamports);

    const commissionRef = db.collection("affiliateCommissions").doc(signature);
    const referralRef = db.collection("referrals").doc(wallet);

    return db.runTransaction(async transaction => {
      const existing = await transaction.get(commissionRef);
      const currentReferral = await transaction.get(referralRef);

      if (existing.exists || !currentReferral.exists) return false;

      const data = currentReferral.data();

      const paymentTime = Number(paymentTimestamp);
      const referralStart = Date.parse(data.createdAt);
      const referralEnd = Date.parse(data.expiresAt);

      if (!Number.isSafeInteger(lamports) || lamports < 10000000 ||
          !Number.isFinite(paymentTime) ||
          !Number.isFinite(referralStart) ||
          !Number.isFinite(referralEnd) ||
          paymentTime < referralStart ||
          paymentTime > referralEnd ||
          data.converted) {
        return false;
      }

      transaction.create(commissionRef, {
        wallet,
        signature,
        affiliateCode: data.referralCode,
        paymentLamports: lamports,
        commissionLamports: commission,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      transaction.update(referralRef, {
        converted: true,
        conversionSignature: signature
      });

      return true;
    });
  }

  return {
    recordReferral,
    getReferral,
    recordCommission
  };
}

module.exports = { createAffiliateSystem };
