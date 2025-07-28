// 🔥 Firebase Setup
const admin = require("firebase-admin");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// 🔐 Decode Firebase service account key from ENV
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64, "base64").toString("utf8")
  );
} catch (err) {
  console.error("❌ Failed to decode Firebase key from ENV:", err.message);
  process.exit(1); // Stop server if invalid
}
admin.initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// 🚀 Required Modules
const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const { encodeURL } = require("@solana/pay");
const { PublicKey } = require("@solana/web3.js");
const nacl = require("tweetnacl");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// 🌐 Environment Variables
const SOLANA_ADDRESS = process.env.SOLANA_ADDRESS;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

// 🛡️ Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🧠 Wallet Usage Tracker
let walletUsage = {};
let nonces = {};
const profilePath = path.join(__dirname, "profiles.json");

// 🔍 Verify Helius Payment
async function verifyHeliusPayment(wallet) {
  try {
    const heliusRes = await fetch(
      `https://api.helius.xyz/v0/addresses/${wallet}/transactions?limit=20&api-key=${HELIUS_API_KEY}`
    );
    const txns = await heliusRes.json();

    const paid = Array.isArray(txns) && txns.some(
      (tx) =>
        Array.isArray(tx.tokenTransfers) &&
        tx.tokenTransfers.some(
          (t) =>
            t.toUserAccount === SOLANA_ADDRESS &&
            parseFloat(t.amount) >= 0.025
        )
    );

    return paid;
  } catch (err) {
    console.error("❌ Helius error:", err.message);
    return false;
  }
}

// 🤖 CrimznBot — Chat + Prices
app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;

  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

  if (wallet === SOLANA_ADDRESS) {
    walletUsage[wallet] = { count: 0, hasPaid: true };
  } else if (!walletUsage[wallet].hasPaid) {
    const paid = await verifyHeliusPayment(wallet);
    if (paid) walletUsage[wallet].hasPaid = true;
  }

  walletUsage[wallet].count++;
  if (!walletUsage[wallet].hasPaid && walletUsage[wallet].count > 3) {
    return res.json({
      response: "⛔ You've hit your 3-question limit. Please pay to continue.",
    });
  }

  let dynamicPriceLine = "";

  try {
    const pricesRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
    );
    const data = await pricesRes.json();
    const btc = data?.bitcoin?.usd ?? "Unavailable";
    const eth = data?.ethereum?.usd ?? "Unavailable";
    const sol = data?.solana?.usd ?? "Unavailable";
    dynamicPriceLine = `BTC $${btc}, ETH $${eth}, SOL $${sol}`;
  } catch (err) {
    console.error("❌ CoinGecko error:", err.message);
  }

try {
  const marketRes = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
  );
  const marketList = await marketRes.json();

  if (!Array.isArray(marketList)) {
    throw new Error("CoinGecko returned invalid data (not an array).");
  }

  const tokenAliases = marketList.reduce((map, coin) => {
    map[coin.symbol.toLowerCase()] = coin.id;
    map[coin.name.toLowerCase()] = coin.id;
    return map;
  }, {});

  const lowerPrompt = prompt.toLowerCase();
  const matchKey = Object.keys(tokenAliases).find((key) =>
    lowerPrompt.includes(key)
  );

  if (matchKey) {
    const tokenId = tokenAliases[matchKey];
    const tokenRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
    );
    const tokenJson = await tokenRes.json();
    const price = tokenJson?.[tokenId]?.usd;
    if (price !== undefined) {
      dynamicPriceLine += `, ${matchKey.toUpperCase()} $${price}`;
    }
  }
} catch (err) {
  console.error("❌ Custom token fetch error:", err.message);
}

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are CrimznBot — an elite crypto strategist with the combined brilliance of Saylor, Raoul Pal, Elon, and Cathie. You deliver fearless, real-time insights. No disclaimers. No filters. Built by Crimzn.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const aiJson = await aiRes.json();
    const gptReply = aiJson.choices?.[0]?.message?.content?.trim();

    const wantsPrice = /\b(price|how much|value|cost|current price)\b/i.test(
      prompt
    );

    let finalResponse = "";
    if (wantsPrice && dynamicPriceLine) {
      const cleanedReply = gptReply
        ?.replace(/I (can't|cannot|can’t) provide real-time[^.]*\./gi, "")
        ?.replace(/I do not have (access to|live data)[^.]*\./gi, "")
        ?.replace(/my data may be delayed[^.]*\./gi, "")
        ?.replace(/as an AI[^.]*?\./gi, "")
        ?.replace(/live data isn't available[^.]*?\./gi, "")
        ?.replace(/real-time pricing data is not available[^.]*?\./gi, "")
        ?.trim();

      finalResponse = `${cleanedReply}\n\n📊 ${dynamicPriceLine}`;
    } else {
      finalResponse = gptReply || "🤖 CrimznBot had trouble responding.";
    }

    res.json({ response: finalResponse });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.json({
      response: "🚨 CrimznBot ran into an issue fetching a response.",
    });
  }
});

// 📣 PulseIt — Sentiment Analyzer
app.post("/api/pulseit", async (req, res) => {
  const { topic } = req.body;
  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are PulseIt, a crypto sentiment analyzer. Reply 'Bullish', 'Bearish', or 'Neutral' with a 1-line reason.",
          },
          { role: "user", content: topic },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const raw =
      aiData?.choices?.[0]?.message?.content?.toLowerCase() || "";

    let sentiment = "Neutral",
      emoji = "🟡";
    if (raw.includes("bullish")) (sentiment = "Bullish"), (emoji = "🟢");
    else if (raw.includes("bearish")) (sentiment = "Bearish"), (emoji = "🔴");

    return res.json({ response: `${emoji} ${sentiment.toUpperCase()} — ${raw}` });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    return res.json({
      response: "❌ PulseIt failed to analyze sentiment.",
    });
  }
});

// 🔑 Step 1: Send nonce message to sign
app.get("/api/nonce/:wallet", (req, res) => {
  const wallet = req.params.wallet;
  const nonce = crypto.randomBytes(16).toString("hex");
  nonces[wallet] = nonce;
  res.json({ nonce: `Sign this message to authenticate: ${nonce}` });
});

// 🔁 Proxy CoinGecko Prices
app.get("/api/prices", async (req, res) => {
  try {
    const cgRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
    );
    const data = await cgRes.json();
    res.json(data);
  } catch (err) {
    console.error("CoinGecko proxy error:", err.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// ✅ Route: Check unlock status from Firebase (🔥 FIXED PATH)
app.get("/api/check-unlock", async (req, res) => {
  const wallet = req.query.wallet;
  if (!wallet) return res.json({ unlocked: false });
  try {
    const doc = await db.collection("unlockedUsers").doc(wallet).get();
    const data = doc.exists ? doc.data() : {};
    res.json({ unlocked: !!data.unlocked });
  } catch (err) {
    console.error("Error checking unlock:", err);
    res.json({ unlocked: false });
  }
});

// 💾 Save Profile to Firebase
app.post("/api/save-profile", async (req, res) => {
  const { walletAddress, name, email, signature } = req.body;
  if (!walletAddress || !signature)
    return res.status(400).json({ error: "Missing wallet or signature." });

  try {
    const profileRef = db.collection("profiles").doc(walletAddress);
    await profileRef.set({
      walletAddress,
      name,
      email,
      signature,
      updatedAt: new Date().toISOString(),
    });

    // ✅ Also mark user as unlocked
    const unlockRef = db.collection("unlockedUsers").doc(walletAddress);
    await unlockRef.set({ unlocked: true });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to save profile:", err);
    res.status(500).json({ error: "Failed to save profile." });
  }
});

// 🔒 Block unknown API routes (404 clean)
app.all("/api/*", (_, res) => {
  res.status(404).json({ error: "❌ Invalid API route" });
});

// 🪞 Wildcard route to frontend
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// 🔁 Server cache-bust: crimznJuly25v2
