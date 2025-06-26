// 🔐 Load modules
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { OpenAI } = require("openai");
require("dotenv").config();

// 🚀 Server setup
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔑 OpenAI init
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🤖 CrimznBot AI logic
app.post("/api/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    // 🔎 Detect price-based question
    const priceMatch = question.match(/price of (\w+)/i);
    if (priceMatch) {
      const token = priceMatch[1].toLowerCase();
      const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`);
      const priceData = await priceRes.json();

      if (priceData[token] && priceData[token].usd) {
        return res.json({
          response: `💰 The current price of ${token.toUpperCase()} is $${priceData[token].usd}.`
        });
      } else {
        return res.json({
          response: `⚠️ Sorry, I couldn't find price data for "${token}".`
        });
      }
    }

    // 🧠 Fallback to CrimznBot GPT-4o
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot — a bold, concise, crypto-native AI with the brain of Raoul Pal, Michael Saylor, and Cathie Wood. Give powerful, informed answers with conviction."
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.7
    });

    const answer = completion.choices[0].message.content.trim();
    return res.json({ response: answer });

  } catch (err) {
    console.error("CrimznBot error:", err.message);
    return res.status(500).json({ error: "CrimznBot failed to respond." });
  }
});

// 📊 PulseIt Sentiment Analyzer
app.post("/api/pulse", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are PulseIt: a crypto-native sentiment engine. Classify the user's message as 📈 Bullish, 📉 Bearish, or ⚖️ Neutral based on market impact. Respond with one-word sentiment, a short reason, and one emoji."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.5
    });

    const sentiment = completion.choices[0].message.content.trim();
    return res.json({ response: sentiment });

  } catch (err) {
    console.error("PulseIt error:", err.message);
    return res.status(500).json({ error: "PulseIt failed to respond." });
  }
});

// 🌐 Start server
app.listen(port, () => {
  console.log(`🚀 CrimznBot + PulseIt live at http://localhost:${port}`);
});
