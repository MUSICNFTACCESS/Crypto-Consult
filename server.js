// 🌐 Blockchain & Web3
require("dotenv").config(); // ✅ Load .env first
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const nocache = require("nocache");
const path = require("path"); // ✅ Used for sendFile
const tweetnacl = require("tweetnacl"); // ✅ Wallet signature verification
const crypto = require("crypto"); // ✅ Used for nonce hashing/verify
const fetch = require("node-fetch"); // ✅ External API calls
const { PublicKey } = require("@solana/web3.js"); // ✅ Phantom wallets

// 🔐 Firebase Admin
const admin = require("firebase-admin");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf8")
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// 🌍 Global Variables
const SOLANA_ADDRESS = process.env.SOLANA_ADDRESS;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

// 🚀 Init App
const app = express();
app.use(express.json());
app.use(cors({ origin: true }));
app.use(helmet());
app.use(nocache());
app.use(express.static("public"));

// 🧠 In-memory usage tracker
const walletUsage = {};

// 🔐 Verify Helius 0.025 SOL unlock
async function verifyHeliusPayment(wallet) {
  const heliusRes = await fetch(`https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}`);
  const data = await heliusRes.json();
  return data?.some(tx => tx?.description?.includes("0.025 SOL"));
}

// 🔓 CrimznBot Route
app.post("/ask", async (req, res) => {
  const { question, wallet } = req.body;
  if (!question) return res.status(400).json({ error: "Question missing" });

  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };
  walletUsage[wallet].count++;

  if (walletUsage[wallet].count > 3 && !walletUsage[wallet].hasPaid) {
    const verified = await verifyHeliusPayment(wallet);
    if (verified) {
      walletUsage[wallet].hasPaid = true;
    } else {
      return res.json({
        response: "🔒 You've used your 3 free questions. Please unlock CrimznBot to continue.",
      });
    }
  }

  try {
    const wantsPrice = /price of|how much is|current value/i.test(question);
    if (wantsPrice) {
      let symbol = question.toLowerCase().includes("sol") ? "solana"
                 : question.toLowerCase().includes("eth") ? "ethereum"
                 : question.toLowerCase().includes("btc") ? "bitcoin"
                 : null;

      if (symbol) {
        const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
        const json = await priceRes.json();
        return res.json({ response: `🟢 ${symbol.toUpperCase()} is $${json[symbol].usd}` });
      }
    }

    return res.json({ response: "🟢 CrimznBot here. Ask me anything crypto, trading, or macro!" });

  } catch (err) {
    console.error("❌ Error in /ask route:", err);
    res.status(500).json({ error: "CrimznBot error" });
  }
});

// 💾 Save Profile to Firestore
app.post("/save-profile", async (req, res) => {
  try {
    const { wallet, name, email } = req.body;
    if (!wallet) return res.status(400).json({ error: "Wallet address required" });

    const userRef = db.collection("users").doc(wallet);
    await userRef.set({
      name: name || "",
      email: email || "",
      updated: Date.now()
    }, { merge: true });

    res.status(200).json({ message: "✅ Profile saved" });
  } catch (err) {
    console.error("❌ Error saving profile:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📊 PulseIt - Sentiment Analyzer
app.post("/pulse-it", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    // Stubbed — Replace with actual analysis logic later
    const pulse = text.toLowerCase().includes("bullish") ? "Bullish" :
                  text.toLowerCase().includes("bearish") ? "Bearish" : "Neutral";

    res.status(200).json({ sentiment: pulse });
  } catch (err) {
    console.error("❌ PulseIt error:", err);
    res.status(500).json({ error: "Sentiment analysis failed" });
  }
});

// ✉️ Become a Sponsor Handler (Optional)
app.post("/sponsor", async (req, res) => {
  try {
    const { name, email, tier } = req.body;
    if (!email || !tier) return res.status(400).json({ error: "Missing sponsor details" });

    const sponsorRef = db.collection("sponsors").doc(email);
    await sponsorRef.set({
      name: name || "Anonymous",
      tier,
      timestamp: Date.now()
    });

    res.status(200).json({ message: "✅ Sponsor info saved" });
  } catch (err) {
    console.error("❌ Sponsor route error:", err);
    res.status(500).json({ error: "Sponsor registration failed" });
  }
});

// 📈 ETF Inflow Tracker Stub (Optional future)
app.get("/etf-flows", async (req, res) => {
  try {
    const response = await fetch("https://farside.link/etf/btc");
    const html = await response.text();
    res.status(200).send(html); // Optional: parse this HTML to show clean data
  } catch (err) {
    console.error("ETF Tracker failed:", err);
    res.status(500).json({ error: "ETF tracker failed" });
  }
});

// 🧱 Block malformed URI paths (💥 URI fix)
app.use((req, res, next) => {
  try {
    decodeURIComponent(req.path);
    next();
  } catch (err) {
    console.error("Malformed URI path blocked:", req.path);
    return res.status(400).send("Bad Request");
  }
});

// 🧨 Wildcard route — Serve Frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
console.log("Reached end of server.js — about to listen...");

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

// 🛑 Block unknown API routes (404 clean)
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "❌ Invalid API route" });
});

// 💡 Server cache-bust tag
// 🧾 Version: crimznJuly29v2-complete
// 👻 Trigger redeploy
