const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve index.html, etc.

//
// 🤖 CrimznBot Chat Endpoint (used by /ask)
//
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are CrimznBot, a strategic crypto and macroeconomic consultant like Raoul Pal, Michael Saylor, and Cathie Wood. Provide concise, confident, data-informed answers based on real market dynamics and institutional insights."
          },
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "No response";
    res.json({ answer });
  } catch (error) {
    console.error("❌ OpenAI request failed:", error.message);
    res.status(500).json({ answer: null, error: "OpenAI request failed" });
  }
});

//
// 📈 Sentiment Analyzer (used by /api/sentiment)
//
app.post("/api/sentiment", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a crypto sentiment analyst. Analyze sentiment for the term provided and respond in JSON format with a 1-10 score and short summary. Use: { \"sentiment_score\": 7, \"summary\": \"...\", \"tags\": [\"Bullish\"] }"
          },
          {
            role: "user",
            content: `Analyze sentiment for ${query}. Respond only with a clean JSON object.`
          }
        ]
      })
    });

    const raw = await response.json();
    const content = raw.choices?.[0]?.message?.content?.trim();

    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      sentiment_score: parsed.sentiment_score || "N/A",
      summary: parsed.summary || "N/A",
      tags: parsed.tags || ["Uncertain"]
    });
  } catch (error) {
    console.error("❌ GPT sentiment error:", error.message);
    res.status(500).json({ error: "Sentiment analysis failed" });
  }
});

//
// 🚀 Start Server
//
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot backend running at http://localhost:${PORT}`);
});
