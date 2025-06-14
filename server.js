const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const path = require("path");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🤖 CrimznBot Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are CrimznBot, a strategic crypto analyst." },
        { role: "user", content: userMessage },
      ],
    });

    res.json({ reply: chat.choices[0].message.content });
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    res.status(500).json({ error: "Chat error" });
  }
});

// 💸 Real-Time Prices with GPT Fallback
app.get("/prices", async (req, res) => {
  try {
    const cgResponse = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await cgResponse.json();

    res.json({
      btc: data.bitcoin.usd,
      eth: data.ethereum.usd,
      sol: data.solana.usd,
    });
  } catch (err) {
    console.error("❌ CoinGecko API failed:", err.message);

    try {
      const fallback = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a fallback price oracle. Respond in JSON only." },
          { role: "user", content: "What are the prices of BTC, ETH, and SOL today?" },
        ],
      });

      const parsed = JSON.parse(fallback.choices[0].message.content);

      res.json({
        btc: parsed.btc || "Error",
        eth: parsed.eth || "Error",
        sol: parsed.sol || "Error",
      });
    } catch (fallbackErr) {
      console.error("❌ GPT Fallback failed:", fallbackErr.message);
      res.json({ btc: "Error", eth: "Error", sol: "Error" });
    }
  }
});

// 🧠 Sentiment Analyzer
app.post("/api/sentiment", async (req, res) => {
  const query = req.body.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a crypto sentiment analyst. Respond ONLY in this JSON format:\n```json\n{\n  \"sentiment_score\": 7,\n  \"summary\": \"...\",\n  \"tags\": [\"Bullish\"]\n}\n```" },
        { role: "user", content: `Analyze sentiment for ${query}. Respond only as JSON.` },
      ],
    });

    const raw = gptResponse.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      sentiment_score: parsed.sentiment_score || "N/A",
      summary: parsed.summary || "N/A",
      tags: parsed.tags || ["Uncertain"],
    });
  } catch (err) {
    console.error("❌ GPT sentiment error:", err.message);
    res.json({ error: "GPT sentiment failed." });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot backend running on http://localhost:${PORT}`);
});
