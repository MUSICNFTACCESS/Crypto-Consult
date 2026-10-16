"use strict";

const crypto = require("crypto");
const nacl = require("tweetnacl");
const bs58 = require("bs58");
const { PublicKey } = require("@solana/web3.js");

const challenges = new Map();
const sessions = new Map();

const CHALLENGE_TTL = 5 * 60 * 1000;
const SESSION_TTL = 60 * 60 * 1000;

function validateWallet(wallet) {
  if (typeof wallet !== "string") {
    throw new Error("Invalid wallet");
  }
  const key = new PublicKey(wallet);
  if (key.toBase58() !== wallet) {
    throw new Error("Invalid wallet");
  }
  return key;
}

function cleanExpired() {
  const now = Date.now();
  for (const [key, value] of challenges) {
    if (value.expiresAt <= now) challenges.delete(key);
  }
  for (const [key, value] of sessions) {
    if (value.expiresAt <= now) sessions.delete(key);
  }
}

function createChallenge(wallet) {
  validateWallet(wallet);
  cleanExpired();

  if (challenges.size >= 1000) {
    throw new Error("Too many challenges");
  }

  const expiresAt = Date.now() + CHALLENGE_TTL;
  const nonce = crypto.randomBytes(32).toString("hex");

  const message =
    "CryptoConsult wallet authentication\n" +
    "Domain: " + (process.env.AUTH_DOMAIN || "crypto-consult.onrender.com") + "\n" +
    "Wallet: " + wallet + "\n" +
    "Nonce: " + nonce + "\n" +
    "Expires: " + new Date(expiresAt).toISOString() +
    "\nNo transaction or SOL payment required.";

  challenges.set(wallet, { message, expiresAt });
  return message;
}

function verifyChallenge(wallet, signature) {
  cleanExpired();
  const challenge = challenges.get(wallet);
  if (!challenge || typeof signature !== "string") {
    return null;
  }

  try {
    const key = validateWallet(wallet);
    const bytes = bs58.decode(signature);
    if (bytes.length !== 64) return null;

    const valid = nacl.sign.detached.verify(
      Buffer.from(challenge.message, "utf8"),
      bytes,
      key.toBytes()
    );

    if (!valid) return null;

    challenges.delete(wallet);

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, {
      wallet,
      expiresAt: Date.now() + SESSION_TTL
    });
    return token;
  } catch {
    return null;
  }
}

function getSessionWallet(token) {
  if (typeof token !== "string" || token.length !== 64) {
    return null;
  }
  const session = sessions.get(token);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session.wallet;
}

module.exports = {
  createChallenge,
  verifyChallenge,
  getSessionWallet
};
