const express = require("express");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🏠 Serve Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 💰 Simulated Live Prices using GPT-4o
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/prices", async (req, res) => {
  try {
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You simulate a crypto price API. Respond only in JSON like this: {\"BTC\":12345,\"ETH\":2345,\"SOL\":145}. No extra text.",
        },
        {
          role: "user",
          content: "Return current USD prices for BTC, ETH, and SOL.",
        },
      ],
    });

    const text = gptResponse.choices[0].message.content;
    const parsed = JSON.parse(text);

    res.json({
      btc: parsed.BTC || "Error",
      eth: parsed.ETH || "Error",
      sol: parsed.SOL || "Error",
    });
  } catch (err) {
    console.error("❌ GPT price fetch error:", err.message);
    res.json({ btc: "Error", eth: "Error", sol: "Error" });
  }
});

// 🤖 CrimznBot Chat
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Missing message" });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot, a confident, sharp crypto strategist inspired by Raoul Pal, Michael Saylor, and Cathie Wood. Provide clear, forward-thinking responses with insight and edge.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.json({ reply: "⚠️ CrimznBot glitch – try again shortly." });
  }
});

// 🧠 Sentiment via GPT-4o (with strict JSON + fallback)
app.post("/api/sentiment", async (req, res) => {
  const query = req.body.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a crypto sentiment analyst. Respond ONLY in this exact JSON format: {\"sentiment_score\": 7, \"summary\": \"...\", \"tags\": [\"Bullish\"]}. No intro, no markdown, no formatting.",
        },
        {
          role: "user",
          content: `Analyze sentiment for ${query}. Respond only as JSON.`,
        },
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot backend running on http://localhost:${PORT}`);
});
