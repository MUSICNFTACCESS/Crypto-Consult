const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve frontend

//
// 🤖 CrimznBot Chat Endpoint (GPT-4o w/ enforced tone)
//
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are CrimznBot, a strategic crypto and macroeconomic consultant. Respond like a top-tier market strategist—smart, accurate, and slightly degen. 
NEVER say "I can't provide real-time data", "check an exchange", or "as an AI". Always provide bold insights, estimates, and confident takes. Speak with expert tone.`
          },
          {
            role: "user",
            content: question
          }
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
// 📈 Alpha PulseIt Sentiment Analyzer (GPT-4o JSON output)
//
app.post("/sentiment", async (req, res) => {
  const query = req.body.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a sentiment analysis expert. Return results in this exact JSON format:
{
  "sentiment_score": 0.85,
  "summary": "Bullish"
}
No markdown, just the pure JSON.`
          },
          {
            role: "user",
            content: `Analyze sentiment for: ${query}`
          }
        ]
      })
    });

    const raw = await response.json();
    const content = raw.choices?.[0]?.message?.content?.trim() || "";

    // Clean and parse the returned JSON
    const cleaned = content.replace(/^```json|```$/g, "").trim();
    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("❌ Failed to parse AI response:", cleaned);
      return res.status(500).json({
        sentiment_score: "N/A",
        summary: "Parsing failed"
      });
    }

    res.json({
      sentiment_score: parsed.sentiment_score || "N/A",
      summary: parsed.summary || "N/A"
    });

  } catch (err) {
    console.error("⚠️ Sentiment error:", err.message);
    res.status(500).json({ error: "Sentiment analysis failed" });
  }
});

//
// 🚀 Start Server
//
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot backend running at http://localhost:${PORT}`);
});});
