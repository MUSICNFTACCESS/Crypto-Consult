const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/ask", async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    // 🧠 Attempt to extract a token for price fetching
    const priceMatch = question.match(/price of (\w+)/i);
    if (priceMatch) {
      const token = priceMatch[1].toLowerCase();

      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`);
      const data = await response.json();

      if (data[token] && data[token].usd) {
        return res.json({
          response: `💰 The current price of ${token.toUpperCase()} is $${data[token].usd}`
        });
      } else {
        return res.json({
          response: `⚠️ Sorry, I couldn't find price data for "${token}".`
        });
      }
    }

    // 🤖 Fallback to GPT-4o for general questions
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot — a bold, concise, crypto-native AI that specializes in market data, education, and trading insight."
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
