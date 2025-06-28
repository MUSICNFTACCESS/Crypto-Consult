// 🤖 CrimznBot with Real-Time Price Logic + PulseIt Sentiment + Strategic Macro Insight
const express = require("express");
const fetch = require("node-fetch");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public")); // Serves index.html + radar.html etc.

// 🛡️ Basic Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("🔐 OPENAI_API_KEY Loaded:", process.env.OPENAI_API_KEY ? "✅ Present" : "❌ MISSING");

// ✅ GET /api/price — Manual Price Checks
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

// ✅ POST /api/ask — CrimznBot AI + Price + Sentiment
app.post("/api/ask", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const lower = message.toLowerCase();

  // 💬 PulseIt basic keywords
  const bullish = ["etf", "adoption", "halving", "bullish", "blackrock", "trump", "michael saylor", "raoul pal", "cathie wood"];
  const bearish = ["recession", "war", "inflation", "crash", "dump", "rug", "scam"];
  let pulse = "Neutral 🟡";
  if (bullish.some(w => lower.includes(w))) pulse = "Bullish 🟢";
  else if (bearish.some(w => lower.includes(w))) pulse = "Bearish 🔴";

// ✅ Real-Time Price route
app.get("/api/prices", async (req, res) => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await response.json();

    res.json({
      price: {
        bitcoin: data.bitcoin.usd,
        ethereum: data.ethereum.usd,
        solana: data.solana.usd,
      },
    });
  } catch (err) {
    console.error("Price Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

  // 🎯 GPT-4o Fallback — Strategic Tone
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are CrimznBot: a strategic, macro-aware, GPT-4o-powered crypto consultant named Crimzn. You think like Raoul Pal, Michael Saylor, and Cathie Wood. Your tone is sharp, confident, slightly degen, and always fact-driven."
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

// ✅ POST /api/pulse — PulseIt Sentiment for any word/phrase/headline
app.post("/api/pulse", async (req, res) => {
  const phrase = req.body.headline;
  if (!phrase) return res.status(400).json({ error: "Phrase is required" });

  const pulsePrompt = `You are PulseIt, a crypto-native sentiment bot. You take in short phrases or headlines and return one word: Bullish, Bearish, or Neutral — based on the crypto market’s interpretation.\n\nInput: "${phrase}"\n\nSentiment:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: pulsePrompt }],
      temperature: 0.3,
    });

    const sentiment = completion.choices?.[0]?.message?.content?.trim() || "Neutral";
    res.json({ sentiment });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).json({ error: "PulseIt sentiment analysis failed" });
  }
});

// 🔁 Root
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 🚀 Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CrimznBot server listening on port ${PORT}`);
});
