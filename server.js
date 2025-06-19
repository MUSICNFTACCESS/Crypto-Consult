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
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are CrimznBot, a strategic crypto and macroeconomic consultant. You provide smart, accurate, and slightly degen-flavored advice about market trends, tokens, news, and alpha. Never respond with 'as an AI' or generic disclaimers—just concise, confident insight."
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
            content: "You are a sentiment analysis expert. Analyze the sentiment of the given word, name, or topic and reply only in this JSON format: { \"sentiment_score\": 0.75, \"summary\": \"Bullish\" }"
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

    // Remove markdown/code formatting if present
    const cleaned = content.replace(/^```json|```$/g, "").trim();

    // Attempt to parse it
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("❌ Failed to parse AI response:", cleaned);
      return res.status(500).json({ sentiment_score: "N/A", summary: "Parsing failed" });
    }

    res.json({
      sentiment_score: parsed.sentiment_score || "N/A",
      summary: parsed.summary || "N/A"
    });

  } catch (err) {
    console.error("⚠️ GPT sentiment error:", err.message);
    res.status(500).json({ error: "Sentiment analysis failed" });
  }
});

//
// 🚀 Start Server
//
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot backend running at http://localhost:${PORT}`);
});
