const path = require("path");
const express = require("express");
require("dotenv").config(); // ✅ env vars

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(express.static("public"));
app.use(require("express").json());

const HELIUS_API_KEY = process.env.HELIUS_API_KEY; // ✅
const HELIUS_TX_URL = process.env.HELIUS_TX_URL;
const SOLANA_ADDRESS = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF"; // ✅ your wallet

// 🆕 Track usage per wallet in memory
const walletUsage = {}; // { walletAddress: { count: number, hasPaid: boolean } }

// 🧠 CrimznBot – Crypto Price GPT + Hybrid AI
app.post("/api/crimznbot", async (req, res) => {
  const question = (req.body.question || req.body.message || "").toLowerCase(); // ✅ fallback
  const wallet = req.body.wallet || null; // 🆕 incoming wallet address

  if (!question) return res.status(400).json({ response: "No question provided." });

  // ✅ Usage tracking
  if (wallet) {
    if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

    const usage = walletUsage[wallet];

    if (!usage.hasPaid && usage.count >= 3) {
      return res.json({ response: "🔒 You've hit the 3-question limit. Unlock with Solana Pay." }); // ✅
    }
  }

  // 🧠 Token map
  const tokenMap = {
    btc: "bitcoin", bitcoin: "bitcoin",
    eth: "ethereum", "eth-usd": "ethereum",
    sol: "solana", "sol-usd": "solana",
    link: "chainlink", ondo: "ondo-finance",
    jup: "jupiter-exchange", bonk: "bonk",
    stx: "stacks", crv: "curve-dao-token",
    mkr: "maker", doge: "dogecoin", pepe: "pepe"
  };

  const matchedToken = Object.keys(tokenMap).find(key => question.includes(key));
  const tokenId = matchedToken ? tokenMap[matchedToken] : null;

  // 🆕 If token mentioned → fetch real-time price
  if (tokenId) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`;
      const prices = await fetch(url);
      const priceData = await prices.json();
      const usd = priceData[tokenId]?.usd;

      if (usd) {
        if (wallet) walletUsage[wallet].count++; // ✅ only increase if valid
        return res.json({ response: `🟢 ${tokenId.toUpperCase()} is currently $${usd.toLocaleString()}` });
      }
    } catch (err) {
      console.error("Price fetch error:", err.message);
      return res.status(500).json({ response: "❌ Error fetching price data." });
    }
  }

  // 🧠 Fallback → OpenAI GPT
  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4", // 🔄 upgraded model
      messages: [
        {
          role: "system",
          content: "You are CrimznBot – a sharp, degen-friendly crypto strategist with the mind and insights of Raoul Pal, Michael Saylor, and Cathie Wood."
        },
        { role: "user", content: question }
      ],
      temperature: 0.7
    });

    const reply = chat.choices[0]?.message?.content || "⚠️ CrimznBot is offline.";

    if (wallet) walletUsage[wallet].count++; // ✅ Increment usage
    return res.json({ response: reply });

  } catch (err) {
    console.error("CrimznBot error:", err.message);
    return res.status(500).json({ response: "❌ CrimznBot failed to respond." });
  }
});

// 🧠 PulseIt – Market News Sentiment Classifier
app.post("/api/pulseit", async (req, res) => {
  const input = req.body.input;

  if (!input) {
    return res.status(400).json({
      sentiment: "neutral",
      emoji: "😐",
      explanation: "No input provided."
    });
  }

  try {
    const classify = await openai.chat.completions.create({
      model: "gpt-4", // 🔄
      messages: [
        {
          role: "system",
          content: "You are PulseIt – a crypto sentiment oracle. Respond with ONE WORD ONLY: bullish, bearish, or neutral."
        },
        { role: "user", content: input }
      ],
      temperature: 0.5
    });

    const sentiment = classify.choices?.[0]?.message?.content?.trim().toLowerCase();

    let emoji = "😐";
    if (sentiment.includes("bullish")) emoji = "🟢";
    else if (sentiment.includes("bearish")) emoji = "🔴";

    const explain = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are PulseIt – a spicy, concise crypto analyst. Explain the sentiment behind the news in ONE punchy sentence."
        },
        { role: "user", content: input }
      ],
      temperature: 0.8
    });

    const explanation = explain.choices?.[0]?.message?.content?.trim();

    res.json({ sentiment, emoji, explanation });

  } catch (err) {
    console.error("PulseIt error:", err.message);
    res.status(500).json({
      sentiment: "neutral",
      emoji: "😐",
      explanation: "An error while analyzing sentiment."
    });
  }
});

// 🆕 Solana Pay – Verify transaction using Helius
app.post("/api/verify", async (req, res) => {
  const wallet = req.body.wallet;

  if (!wallet) return res.status(400).json({ paid: false, message: "No wallet provided." });

  if (!HELIUS_TX_URL || !HELIUS_API_KEY) {
    return res.status(500).json({ paid: false, error: "Helius config missing" });
  }

  const heliusURL = `${HELIUS_TX_URL}/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=10`;
  console.log(`🔍 Checking payments via:`, heliusURL);

  try {
    const txs = await fetch(heliusURL).then(r => r.json());

    const paid = txs?.some(tx =>
      tx.description?.toLowerCase().includes("transfer") &&
      tx.nativeTransfers?.some(transfer =>
        transfer?.toUserAccount === SOLANA_ADDRESS &&
        transfer?.amount >= 25000 // ✅ 0.025 SOL = 25000 lamports
      )
    );

    // 🆕 Update in-memory record
    if (paid) {
      if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: true };
      walletUsage[wallet].hasPaid = true;
    }

    res.json({ hasPaid: paid });
  } catch (err) {
    console.error("❌ Verify payment error:", err.message);
    res.status(500).json({ hasPaid: false, error: "Verification failed" });
  }
});

// ✅ Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});



