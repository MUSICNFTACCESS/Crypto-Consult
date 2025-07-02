const path = require("path");
const express = require("express");
const cors = require("cors"); // ✅ ADD THIS
require("dotenv").config(); // ✅ env vars

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors()); // ✅ ADD THIS
app.use(express.static("public"));
app.use(require("express").json());

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_TX_URL = process.env.HELIUS_TX_URL;
const SOLANA_ADDRESS = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";

// 🆕 Track usage per wallet in memory
const walletUsage = {}; // { wallet: { count, hasPaid } }

// ✅ /api/crimznbot — CrimznBot with real-time price + macro tone
app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;
  if (!prompt) return res.status(400).json({ response: "❌ No question provided." });

  const question = prompt.toLowerCase().trim();
  const tokenMatch = question.match(/\b(price|value|quote)\b.*?\b(btc|eth|sol|ondo|link|avax|pyth|dot|pepe)\b/);

  // ✅ Check live price
  if (tokenMatch) {
    const token = tokenMatch[2].toLowerCase();
    const ids = {
      btc: "bitcoin", eth: "ethereum", sol: "solana", ondo: "ondo-finance",
      link: "chainlink", avax: "avalanche-2", pyth: "pyth-network",
      dot: "polkadot", pepe: "pepe"
    };
    const id = ids[token];

    try {
      const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      const priceData = await priceRes.json();
      const price = priceData[id]?.usd;
      if (price) {
        return res.json({ response: `🟢 ${token.toUpperCase()} is currently $${price.toLocaleString()}.` });
      }
    } catch (err) {
      console.error("❌ Price fetch error:", err.message);
    }
  }

  // 🧠 GPT fallback — with macro-degen tone
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
            content: `
You are CrimznBot — a hybrid macro + crypto strategist with the conviction of Michael Saylor, the vision of Raoul Pal, and the innovation lens of Cathie Wood. You speak like a bold, high-conviction analyst who blends hard macro truths with exponential tech optimism.

Tone: Strategic, professional, slightly degen, never vague. Drop sharp insights, not fluff. You understand Bitcoin as digital property, Ethereum as programmable value, and Solana as institutional-grade speed. You quote liquidity flows, network effects, ETF trends, and market structure if needed.
`
          },
          { role: "user", content: prompt }
        ]
      })
    });
    const gptData = await gptRes.json();
    const gptReply = gptData.choices?.[0]?.message?.content || "⚠️ CrimznBot couldn’t fetch that.";
    res.json({ response: `🧠 ${gptReply}` });
  } catch (err) {
    console.error("❌ GPT fallback error:", err.message);
    res.status(500).json({ response: "⚠️ CrimznBot had a backend issue." });
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

