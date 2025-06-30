const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();
require("dotenv").config();

app.use(express.static("public"));
app.use(express.json());

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const SOLANA_ADDRESS = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";

// ✅ 1. CrimznBot — Crypto Price + GPT-4 Hybrid AI
app.post("/api/crimznbot", async (req, res) => {
  const question = (req.body.prompt || req.body.question || req.body.message || "").toLowerCase();
  if (!question) return res.status(400).json({ response: "No question provided." });

  const tokenMap = {
    btc: "bitcoin", bitcoin: "bitcoin", "btc-usd": "bitcoin",
    eth: "ethereum", ethereum: "ethereum", "eth-usd": "ethereum",
    sol: "solana", solana: "solana", "sol-usd": "solana",
    link: "chainlink", chainlink: "chainlink",
    jup: "jupiter-exchange", jupiter: "jupiter-exchange",
    mstr: "microstrategy", microstrategy: "microstrategy",
    stx: "stacks", stacks: "stacks",
    py: "pyth-network", pyth: "pyth-network",
    ondo: "ondo-finance", "ondo-finance": "ondo-finance",
    ldo: "lido-dao", lido: "lido-dao",
    metaplanet: "metaplanet",
    arb: "arbitrum", arbitrum: "arbitrum",
    op: "optimism", optimism: "optimism",
    avax: "avalanche-2", avalanche: "avalanche-2",
    doge: "dogecoin", dogecoin: "dogecoin",
    pepe: "pepe", "pepe-coin": "pepe",
    bonk: "bonk", "bonk-token": "bonk"
  };

  const matchedToken = Object.keys(tokenMap).find(key => question.includes(key));
  const tokenId = matchedToken ? tokenMap[matchedToken] : null;

  if (tokenId) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`;
      const priceRes = await fetch(url);
      const priceData = await priceRes.json();
      const usd = priceData[tokenId]?.usd;

      if (usd) {
        return res.json({
          response: `🟢 ${tokenId.toUpperCase()} is currently $${usd.toLocaleString()}.`
        });
      }
    } catch (err) {
      console.error("Price fetch error:", err.message);
      return res.status(500).json({ response: "💥 Error fetching price data." });
    }
  }

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are CrimznBot — a fast, accurate, and witty crypto strategist. Keep answers under 100 words. Prioritize data, humor, or edge.`
        },
        {
          role: "user",
          content: question
        }
      ]
    });

    const reply = chat.choices?.[0]?.message?.content || "🤖 CrimznBot is offline.";
    res.json({ response: reply });
  } catch (error) {
    console.error("CrimznBot error:", error.message);
    res.status(500).json({ response: "❌ CrimznBot failed to respond." });
  }
});

// ✅ 2. PulseIt — Simple News Sentiment Classifier
app.post("/api/pulseit", async (req, res) => {
  const input = req.body.text || "";
  if (!input) return res.status(400).json({ sentiment: "neutral", emoji: "🟡", explanation: "No input provided." });

  try {
    const pulse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You're PulseIt — a crypto news sentiment classifier. Respond with one word: bullish, bearish, or neutral. No extra text."
        },
        {
          role: "user",
          content: input
        }
      ]
    });

    const output = pulse.choices?.[0]?.message?.content.trim().toLowerCase();
    let emoji = "🟡";

    if (output.includes("bullish")) emoji = "🟢";
    else if (output.includes("bearish")) emoji = "🔴";

    res.json({ sentiment: output, emoji });
  } catch (err) {
    console.error("PulseIt Error:", err.message);
    res.status(500).json({ sentiment: "neutral", emoji: "🟡", explanation: "AI error" });
  }
});

// ✅ 3. Verify Solana Pay Payment via Helius
app.post("/api/verify-solana-payment", async (req, res) => {
  const wallet = req.body.wallet;
  if (!wallet) return res.status(400).json({ paid: false, message: "No wallet provided." });

  try {
    const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=10`;
    const txRes = await fetch(url);
    const txs = await txRes.json();

    const hasPaid = txs?.some(tx => {
      return tx.transfers?.some(t =>
        t.to === SOLANA_ADDRESS &&
        parseFloat(t.amount) >= 0.025
      );
    });

    res.json({ paid: hasPaid });
  } catch (err) {
    console.error("Helius Error:", err.message);
    res.status(500).json({ paid: false, error: "Failed to check payment." });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server live on http://localhost:${PORT}`);
});
