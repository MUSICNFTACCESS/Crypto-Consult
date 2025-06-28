// 🤖 CrimznBot with Real-Time Price Logic + PulseIt Sentiment + Strategic Macro Insight
const express = require("express");
const fetch = require("node-fetch");
const axios = require("axios");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public")); // Serves index.html + radar.html etc.

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("🔐 OPENAI_API_KEY Loaded:", process.env.OPENAI_API_KEY ? "✅ Present" : "❌ MISSING");

// ✅ GET endpoint for manual price checks via curl or frontend
app.get("/api/price", async (req, res) => {
  const { id, vs } = req.query;
  try {
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: { ids: id, vs_currencies: vs }
    });
    res.json({ price: data[id][vs] });
  } catch (err) {
    console.error("❌ Price API error:", err.message);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

// ✅ POST endpoint: CrimznBot AI + live price + PulseIt sentiment
app.post("/api/ask", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const lower = message.toLowerCase();

  // 💬 PulseIt Sentiment Analyzer
  const bullish = ["etf", "adoption", "halving", "bullish", "blackrock", "trump", "michael saylor", "raoul pal", "cathie wood"];
  const bearish = ["recession", "war", "inflation", "crash", "dump", "rug", "scam"];
  let pulse = "Neutral 🟡";
  if (bullish.some(word => lower.includes(word))) pulse = "Bullish 🟢";
  else if (bearish.some(word => lower.includes(word))) pulse = "Bearish 🔴";

  // 💰 Live price logic
  const tokens = [
    "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "ondo", "link", "ena", "pepe", "doge",
    "dot", "avax", "matic", "ada", "ton", "xrp", "xlm", "shib", "uni", "ltc", "atom", "near", "apt",
    "arb", "op", "kaspa", "inj", "fet", "gala", "render", "snx", "pyth", "sui", "beam", "mina",
    "axl", "joe", "stx", "blur", "jup", "mantra", "celestia", "ocean", "zil", "metis", "radix", "hnt",
    "bsv", "fil", "zec", "ckb", "lrc", "yfi", "1inch", "comp", "bat", "enj", "woo", "cake", "chz",
    "bal", "band", "dydx", "nexo", "rune", "rndr", "lido", "sxp", "hbar", "icp", "egld", "grt", "dai",
    "usdt", "usdc", "fdusd", "tusd", "frax", "rai", "gusd"
  ];
  const found = tokens.find(t => lower.includes(t) && lower.includes("price"));

  if (found) {
    try {
      const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${found}&vs_currencies=usd`);
      const priceData = await priceRes.json();
      const price = priceData[found]?.usd;

      if (price) {
        return res.json({
          response: `🔹 The current price of ${found.toUpperCase()} is **$${price.toLocaleString()} USD**.`,
          pulse
        });
      } else {
        throw new Error("Price not available");
      }
    } catch (err) {
      console.error("❌ Price fetch failed:", err.message);
      return res.json({ response: "Couldn’t fetch price right now. Try again shortly.", pulse });
    }
  }

  // 🎯 GPT-4o fallback with macro tone
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are CrimznBot: a strategic, macro-aware, GPT-4o-powered crypto consultant. You think like Raoul Pal, Michael Saylor, and Cathie Wood combined—macro, degen, and future-focused. Use direct tone with bold market takes."
        },
        { role: "user", content: message }
      ],
      model: "gpt-4"
    });

    return res.json({ response: completion.choices[0].message.content, pulse });
  } catch (err) {
    console.error("❌ GPT error:", err.message);
    return res.status(500).json({ error: "Failed to generate response", pulse });
  }
});

// 🔁 Serve index.html for root route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CrimznBot server listening on port ${PORT}`);
});
// 🔄 Manual Redeploy Trigger: Sat Jun 28 00:00:52 EDT 2025
// ✅ axios installed for Render
