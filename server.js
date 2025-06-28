// 🤖 CrimznBot with Real-Time Price Logic
const express = require("express");
const fetch = require("node-fetch");
const OpenAI = require("openai");
const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/ask", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const lowerMsg = message.toLowerCase();

  // 🪙 Keywords-based live price check
  const tokens = [
    "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "ondo", "link", "pyth", "jup", "dot", "ena", "pepe"
  ];

  const found = tokens.find((key) => lowerMsg.includes(key) && lowerMsg.includes("price"));

  if (found) {
    try {
      const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${found}&vs_currencies=usd`);
      const priceData = await priceRes.json();
      const price = priceData[found].usd;
      return res.json({
        reply: `📈 The current price of ${found.toUpperCase()} is **$${price.toLocaleString()} USD**.`,
      });
    } catch (err) {
      console.error("Price fetch error:", err.message);
      return res.status(500).json({ error: "Failed to get live price." });
    }
  }

  // 💬 Fallback to GPT if not a price question
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot, a sharp, degen-savvy crypto consultant. Give concise, accurate answers. If the question isn't about price, respond with expert clarity.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content.trim();
    return res.json({ reply });
  } catch (err) {
    console.error("CrimznBot fallback error:", err.message);
    return res.status(500).json({ error: "CrimznBot failed to respond." });
  }
});

// 📊 PulseIt Sentiment Analyzer
app.post("/api/pulseit", async (req, res) => {
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
          content: "You are PulseIt: a crypto-native sentiment engine. Classify the user's message as Bullish, Bearish, or Neutral.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.5,
    });

    const reply = completion.choices[0].message.content.trim();
    return res.json({ sentiment: reply });
  } catch (err) {
    console.error("PulseIt error:", err.message);
    return res.status(500).json({ error: "PulseIt failed to respond." });
  }
});

// 🔄 Proxy to CoinGecko to bypass CORS
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

// 🚀 Start Crimzn AI Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 CrimznBot + PulseIt live at http://localhost:${port}`);
});
