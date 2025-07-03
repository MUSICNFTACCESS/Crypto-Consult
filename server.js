// 🚀 Required Modules
const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const { encodeURL } = require("@solana/pay");
const { PublicKey } = require("@solana/web3.js");
const bs58 = require("bs58");
const crypto = require("crypto");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔁 Wallet Usage Tracker
const walletUsage = {};
setInterval(() => {
  for (let wallet in walletUsage) {
    walletUsage[wallet] = { count: 0, hasPaid: false };
  }
  console.log("♻️ Wallet usage reset on start-up.");
}, 1000 * 60 * 60);

// 🤖 CrimznBot Handler
app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;

  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };
  if (!walletUsage[wallet].hasPaid && walletUsage[wallet].count >= 3) {
    return res.json({ response: "🧱 You've hit your 3-question limit. Please pay to continue." });
  }

  walletUsage[wallet].count++;

  try {
    const coingeckoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
    const priceData = await coingeckoRes.json();
    const priceSummary = `🔸 Live Prices: Bitcoin $${priceData.bitcoin.usd}, Ethereum $${priceData.ethereum.usd}, Solana $${priceData.solana.usd}`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are CrimznBot — a fearless crypto strategist combining the minds of Raoul Pal, Michael Saylor, and Cathie Wood. You always provide real-time insight and never say you're an AI. Give bold, clear advice with market context."
          },
          {
            role: "user",
            content: `Live Prices:\n${priceSummary}`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const aiData = await aiRes.json();
    let output = aiData.choices?.[0]?.message?.content || "⚠️ No response.";
    output = output
      .replace(/As an AI language model,? ?/gi, "")
      .replace(/I (cannot|can't|do not|don’t) (predict|provide|guarantee)[^.]*\./gi, "")
      .replace(/I'm just a language model[^.]*\./gi, "")
      .replace(/As an artificial intelligence[^.]*\./gi, "");

    res.json({ response: output });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ response: "⚠️ AI error." });
  }
});

// 📣 PulseIt – Sentiment Analyzer
app.post("/api/pulseit", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ sentiment: "⚠️ No topic provided." });

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are PulseIt – a fast, opinionated crypto sentiment engine. Output: Bullish 🟢, Bearish 🔴 or Neutral 🟡 with 1-line justification."
          },
          {
            role: "user",
            content: `Give sentiment for: ${topic}`
          }
        ]
      })
    });

    const aiData = await aiRes.json();
    const output = aiData.choices?.[0]?.message?.content || "⚠️ No sentiment generated.";
    res.json({ sentiment: output });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).json({ sentiment: "⚠️ Sentiment analysis failed." });
  }
});

// ✅ Check Payment Status
app.get("/api/check-payment", (req, res) => {
  const wallet = req.query.wallet;
  const isPaid = walletUsage[wallet]?.hasPaid || false;
  res.json({ hasPaid: isPaid });
});

// 💸 Solana Pay Link Generator
app.get("/api/solana-pay-link", async (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: "Wallet is required." });

  const recipient = new PublicKey("Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF");
  const amount = 0.025;

  const hash = crypto.createHash("sha256").update(wallet + Date.now()).digest();
  const reference = new PublicKey(bs58.encode(hash.slice(0, 32)));

  const label = "CryptoConsult";
  const message = "Unlock CrimznBot";

  try {
    const url = encodeURL({ recipient, amount, reference, label, message });
    res.json({ url: url.toString() });
  } catch (err) {
    console.error("❌ Solana Pay link error:", err.message);
    res.status(500).json({ error: "Solana Pay generation failed." });
  }
});

// 🔁 Webhook – Payment Confirmation
app.post("/api/webhook", async (req, res) => {
  const events = req.body;
  if (!Array.isArray(events)) return res.sendStatus(400);

  for (const event of events) {
    const payer = event.account || "";
    const recipient = event?.account || "";

    if (
      event.amount >= 25000000 && // 0.025 SOL in lamports
      recipient === "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF"
    ) {
      console.log(`✅ Verified payment from ${payer}`);
      walletUsage[payer] = { hasPaid: true, count: 0 };
    }
  }

  res.sendStatus(200);
});

// 🟢 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

