const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// 🤖 CrimznBot Route
app.post("/api/ask", async (req, res) => {
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
          content: "You are CrimznBot, a crypto consultant with real-time market knowledge. Keep answers concise, actionable, and in a tone that’s smart, strategic, and a little degen. Always reply like Crimzn would. If asked about prices, fetch the current live price via your market logic and give updated numbers in USD."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content.trim();
    return res.json({ response: reply });

  } catch (err) {
    console.error("Chat error:", err.message);
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
          content: "You are PulseIt: a crypto-native sentiment engine. Classify the user's message as Bullish, Bearish, or Neutral."
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

// 🔁 Proxy to CoinGecko to bypass CORS
app.get("/api/price", async (req, res) => {
  const { id = "bitcoin", vs = "usd" } = req.query;

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${vs}`);
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("CoinGecko error:", err.message);
    return res.status(500).json({ error: "Failed to fetch price from CoinGecko." });
  }
});

// 🌐 Start Crimzn AI Server
app.listen(port, () => {
  console.log(`🚀 CrimznBot + PulseIt live at http://localhost:${port}`);
  console.log("🧠 GPT-4o fully online. Awaiting your genius input...");
});
// 🔁 Fri Jun 27 19:10:09 EDT 2025: force rebuild
