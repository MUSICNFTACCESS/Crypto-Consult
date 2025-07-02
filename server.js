// server.js — CrimznBot Backend with Helius, PulseIt, CoinGecko Proxy

const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fetch = require("node-fetch");

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(require("express").json());

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_TX_URL = process.env.HELIUS_TX_URL;
const SOLANA_ADDRESS = process.env.SOLANA_ADDRESS;

const walletUsage = {}; // { wallet: { count, hasPaid, paidAt } }

// 🤖 CrimznBot — Answer w/ real-time price + macro tone
app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;
  if (!prompt) return res.status(400).json({ response: "❌ No question provided." });

  const question = prompt.toLowerCase().trim();
  const tokenMatch = question.match(/\b(price|value|quote)\b.*?\b(btc|eth|sol|ondo|link|nxvl|pyth|dot|pepe)\b/i);

  // ✅ Live token price
  if (tokenMatch) {
    const token = tokenMatch[2].toLowerCase();
    const ids = {
      btc: "bitcoin",
      eth: "ethereum",
      sol: "solana",
      ondo: "ondo-finance",
      link: "chainlink",
      dot: "polkadot",
      pepe: "pepe",
      pyth: "pyth-network",
      nxvl: "nexaverse-launch"
    };
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids[token]}&vs_currencies=usd`;
      const priceRes = await fetch(url);
      const json = await priceRes.json();
      const price = json[ids[token]]?.usd;
      if (price) {
        return res.json({ response: `🟢 ${token.toUpperCase()} is currently $${price.toLocaleString()}.` });
      }
    } catch (err) {
      console.error("❌ Price fetch error:", err.message);
    }
  }

  // 💬 Fallback — with macro-degen tone
  try {
    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `You are CrimznBot — a hybrid macro + crypto strategist infused with the conviction of Michael Saylor, the macro vision of Raoul Pal, and the disruptive mindset of Balaji.
Tone: Strategic, professional, and slightly degen. Never generic. Each reply should sound like a blend of macro alpha and degen edge.

You understand Bitcoin as digital property, Ethereum as programmable money, and Solana as financial bandwidth for institutions. You’re fluent in ETF flows.

Avoid disclaimers. Be direct. Every sentence should deliver insight or action.`
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await gptRes.json();
    const reply = data.choices?.[0]?.message?.content || "⚠️ CrimznBot couldn't fetch that.";
    res.json({ response: reply });
  } catch (err) {
    console.error("❌ GPT fallback error:", err.message);
    res.status(500).json({ response: "⚠️ CrimznBot had a backend issue." });
  }
});

// 📊 PulseIt Sentiment Analyzer
app.post("/api/pulseit", async (req, res) => {
  const { input } = req.body;
  if (!input) return res.status(400).json({ response: "❌ No input provided." });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are PulseIt, a market sentiment analyzer. Output exactly one of these three labels: Bullish, Bearish, or Neutral. Then follow with a bold, one-line reason.\n\nRespond only in this format: '<emoji> <SENTIMENT> — <reason>'"
        },
        { role: "user", content: input }
      ]
    });

    const raw = response.choices?.[0]?.message?.content || "";
    const [sentimentLine] = raw.split("\n");
    const [emoji, ...rest] = sentimentLine.split(" ");
    res.json({ sentiment: emoji, explanation: rest.join(" ") });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).json({ response: "⚠️ Internal error." });
  }
});

// 🔐 Solana Pay — with memory tracking + timestamp
app.get("/api/check-payment", async (req, res) => {
  const wallet = req.query.wallet;
  if (!wallet) return res.status(400).json({ hasPaid: false });

  try {
    if (walletUsage[wallet]?.hasPaid) {
      return res.json({ hasPaid: true });
    }

    const url = `${HELIUS_TX_URL}/addresses/${wallet}/transactions?limit=20`;
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
      walletUsage[wallet] = {
        hasPaid: true,
        count: 0,
        paidAt: new Date().toISOString()
      };
    }

    res.json({ hasPaid: paid });
  } catch (err) {
    console.error("❌ Verify payment error:", err.message);
    res.status(500).json({ hasPaid: false });
  }
});

// 🌐 Proxy prices for frontend CORS fix
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
