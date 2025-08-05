// 🔥 Crimzn Consult Backend - Final Merge: gpt-4o + Firebase + CrimznBot + PulseIt
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const nacl = require("tweetnacl");
const bs58 = require("bs58");
const sentiment = require("sentiment");
const { PublicKey } = require("@solana/web3.js");

// 🔍 ENV Debug
console.log("🧪 Starting ENV Debug Mode...");
console.log("🔐 FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:", process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ? "FOUND" : "❌ MISSING");
console.log("🔑 HELIUS_API_KEY:", process.env.HELIUS_API_KEY ? "FOUND" : "❌ MISSING");
console.log("💼 SOLANA_ADDRESS:", process.env.SOLANA_ADDRESS ? "FOUND" : "❌ MISSING");
console.log("🧠 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "FOUND" : "❌ MISSING");

// 🔐 Firebase Admin Setup (base64-encoded key in Render)
const admin = require("firebase-admin");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

try {
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  const decodedKey = Buffer.from(base64Key, "base64").toString("utf-8");
  const firebaseConfig = JSON.parse(decodedKey);
  admin.initializeApp({
    credential: cert(firebaseConfig),
  });
  console.log("✅ Firebase initialized successfully");
} catch (err) {
  console.error("❌ Failed to decode Firebase key or initialize Firebase:", err);
}

// ⚙️ App Init
const app = express();
const PORT = process.env.PORT || 3000;

// 🔓 Usage Tracking
const walletUsage = {};

// 🔓 Helius Unlock Logic
async function verifyHeliusPayment(wallet) {
  try {
    const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${process.env.HELIUS_API_KEY}&limit=5`;
    const response = await fetch(url);
    const data = await response.json();
    const match = data.find(tx =>
      tx.type === "TRANSFER" &&
      tx.nativeTransfers?.some(t => t.toUserAccount === process.env.SOLANA_ADDRESS && t.amount >= 25000000)
    );
    return !!match;
  } catch (e) {
    console.error("🔴 Failed to verify payment:", e.message);
    return false;
  }
}

// 🧠 CrimznBot: Token Lookup + GPT-4o Crypto Chat (3 Free Questions)
app.post("/ask", async (req, res) => {
  const { prompt, wallet } = req.body;
  if (!prompt || !wallet) return res.send("❌ Missing prompt or wallet.");

  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

  if (walletUsage[wallet].count >= 3 && !walletUsage[wallet].hasPaid) {
    const paid = await verifyHeliusPayment(wallet);
    if (!paid) return res.send("🔒 3 free questions used. Unlock CrimznBot with 0.025 SOL.");
    walletUsage[wallet].hasPaid = true;
  }

  walletUsage[wallet].count++;

  try {
    const tokenAliases = {
      btc: "bitcoin", bitcoin: "bitcoin",
      eth: "ethereum", ethereum: "ethereum",
      sol: "solana", solana: "solana",
      link: "chainlink", dot: "polkadot", ada: "cardano",
      avax: "avalanche-2", matic: "polygon", doge: "dogecoin",
      shib: "shiba-inu", pepe: "pepe", bonk: "bonk",
      sui: "sui", apt: "aptos", arb: "arbitrum",
      op: "optimism", jup: "jupiter-exchange",
      pyth: "pyth-network", rndr: "render-token",
      stx: "stacks", ton: "toncoin", xrp: "ripple",
      usdc: "usd-coin", usdt: "tether", wif: "dogwifcoin"
    };

    const lowerPrompt = prompt.toLowerCase();
    const token = Object.keys(tokenAliases).find(k => lowerPrompt.includes(k));
    if (token) {
      const id = tokenAliases[token];
      const resp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      const data = await resp.json();
      if (data[id]) {
        return res.send(`💰 ${id.toUpperCase()} price: $${data[id].usd}`);
      }
    }

    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are CrimznBot, a strategic, no-fluff crypto consultant. You give clear, insightful answers like a market-savvy degen who’s also a professional. Stick to facts, use short paragraphs, bold key terms, and reference real crypto concepts. Never say you're an AI.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const json = await reply.json();
    const answer = json.choices?.[0]?.message?.content || "🤖 CrimznBot didn’t have a clean read on that.";
    res.send(answer);
  } catch (err) {
    console.error("🛑 CrimznBot error:", err.message);
    res.send("❌ Something went wrong. Try again in a bit.");
  }
});

// 👤 Save Profile to Firebase
app.post("/save-profile", async (req, res) => {
  const { wallet, name, email } = req.body;
  if (!wallet) return res.status(400).send("❌ Wallet is required.");

  try {
    await db.collection("users").doc(wallet).set({
      wallet,
      name: name || "",
      email: email || "",
      timestamp: new Date().toISOString(),
    });
    res.send("✅ Profile saved.");
  } catch (e) {
    console.error("❌ Firebase error:", e.message);
    res.status(500).send("❌ Failed to save profile.");
  }
});

// 📊 PulseIt: GPT-4o Sentiment Analyzer with Emojis + Reasoning
app.post("/pulse", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.send("❌ Missing input.");

  try {
    const s = new sentiment();
    const result = s.analyze(text);
    let vibe = "😐 Neutral";
    if (result.score > 2) vibe = "📈 Bullish";
    else if (result.score < -2) vibe = "📉 Bearish";

    const gptReply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are PulseIt, a crypto market sentiment analyst. Based on the score and message, respond in 1 sentence explaining the sentiment. Always include the correct emoji — 📈 for Bullish, 📉 for Bearish, 😐 for Neutral — and explain why in plain English.",
          },
          {
            role: "user",
            content: `Sentiment text: "${text}"\nRaw score: ${result.score}`
          }
        ],
      }),
    });

    const gptData = await gptReply.json();
    const explanation = gptData.choices?.[0]?.message?.content?.trim() || "No additional insight.";

    res.send(`🧠 PulseIt Score: ${result.score} → ${vibe}\n💬 ${explanation}`);
  } catch (e) {
    console.error("⚠️ PulseIt error:", e.message);
    res.send("❌ Error analyzing sentiment.");
  }
});

// 🧱 Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(express.static(path.join(__dirname, "public")));

// 🌐 Wildcard Route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
  console.log("🧠 CrimznBot + PulseIt + SaveProfile + Firebase booted ✅");
  console.log("⚡ Built by Crimzn, powered by Solana + Helius");
});

// 🛠️ No-op change to force rebuild v=crimznAug05v1
