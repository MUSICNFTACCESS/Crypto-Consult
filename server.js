const path = require("path");
const express = require("express");
require("dotenv").config(); // ✅ env vars

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(express.static("public"));
app.use(require("express").json());

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_TX_URL = process.env.HELIUS_TX_URL;
const SOLANA_ADDRESS = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";

// 🆕 Track usage per wallet in memory
const walletUsage = {}; // { wallet: { count, hasPaid } }

// 🧠 CrimznBot – Hybrid GPT logic
app.post("/api/crimznbot", async (req, res) => {
  const question = (req.body.prompt || req.body.question || req.body.message || "").toLowerCase();
  const wallet = req.body.wallet || null;

  if (!question) return res.status(400).json({ response: "No question provided." });

  if (wallet) {
    if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };
    const usage = walletUsage[wallet];
    if (!usage.hasPaid && usage.count >= 3) {
      return res.json({ response: "🔒 You've hit the 3-question limit. Unlock with Solana Pay." });
    }
    usage.count++;
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are CrimznBot, a crypto-native assistant with bold, strategic insight." },
        { role: "user", content: question }
      ]
    });

    const answer = chatResponse.choices?.[0]?.message?.content || "⚠️ No answer generated.";
    res.json({ response: answer });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ response: "⚠️ Internal server error." });
  }
});

// 🔍 PulseIt Sentiment Analyzer
app.post("/api/pulseit", async (req, res) => {
  const input = req.body.input;
  if (!input) return res.status(400).json({ response: "No input provided." });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are PulseIt, a market sentiment classifier. Output only Bullish, Bearish, or Neutral and a 1-line reason." },
        { role: "user", content: input }
      ]
    });

    const raw = response.choices?.[0]?.message?.content || "";
    const [sentiment, ...reasonParts] = raw.split(":");
    const explanation = reasonParts.join(":").trim();

    res.json({ sentiment: sentiment.trim(), explanation });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).json({ response: "⚠️ Internal error." });
  }
});

// 🔐 Solana Pay Verification
app.get("/api/check-payment", async (req, res) => {
  const wallet = req.query.wallet;
  if (!wallet) return res.status(400).json({ hasPaid: false });

  try {
    const url = `${HELIUS_TX_URL}/addresses/${wallet}/transactions?limit=5`;
    const txRes = await fetch(url, {
      headers: { Authorization: `Bearer ${HELIUS_API_KEY}` }
    });
    const txData = await txRes.json();

    const paid = txData?.some(tx =>
      tx.description?.toLowerCase().includes("transfer") &&
      tx.nativeTransfers?.some(t =>
        t.toUserAccount === SOLANA_ADDRESS && t.amount >= 25000
      )
    );

    if (paid) {
      if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };
      walletUsage[wallet].hasPaid = true;
    }

    res.json({ hasPaid: paid });
  } catch (err) {
    console.error("❌ Verify payment error:", err.message);
    res.status(500).json({ hasPaid: false });
  }
});

// 🆕 Fix CORS: Proxy CoinGecko prices through backend
app.get("/api/prices", async (req, res) => {
  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd";
    const response = await fetch(url);
    const prices = await response.json();
    res.json(prices);
  } catch (err) {
    console.error("❌ CoinGecko fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch prices." });
  }
});

// ✅ Launch
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

