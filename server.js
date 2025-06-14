const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const OpenAI = require("openai");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🚀 Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📈 Live price API
app.get("/prices", async (req, res) => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd", {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });
    const data = await response.json();
    res.json({
      btc: data.bitcoin?.usd || "Error",
      eth: data.ethereum?.usd || "Error",
      sol: data.solana?.usd || "Error",
    });
  } catch (err) {
    console.error("⚠️ CoinGecko fetch failed:", err.message);
    res.json({ btc: "Error", eth: "Error", sol: "Error" });
  }
});

// 🧠 OpenAI Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🤖 CrimznBot chat route
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot, a crypto-native strategist with a confident tone, deep knowledge of Bitcoin, altcoins, and macro market trends. Respond in short, bold insights unless asked to elaborate.",
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
    res.json({ reply: "⚠️ CrimznBot glitch – check back in a few. If urgent, contact Crimzn directly." });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
// ✅ Pulse Sentiment Route
app.post("/api/sentiment", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing sentiment query" });
  }

  try {
    const response = await fetch("https://api.coinstats.app/public/v1/news?skip=0&limit=30");
    const data = await response.json();
    const articles = data.news.filter(n => n.title.toLowerCase().includes(query.toLowerCase()));

    let score = 0;
    articles.forEach(n => {
      const title = n.title.toLowerCase();
      if (title.includes("up") || title.includes("gain")) score++;
      if (title.includes("down") || title.includes("drop")) score--;
    });

    let sentiment = "Neutral 🤔";
    if (score > 1) sentiment = "Bullish 🟢";
    else if (score < -1) sentiment = "Bearish 🔴";

    res.json({ sentiment });
  } catch (err) {
    console.error("❌ Sentiment error:", err.message);
    res.status(500).json({ error: "Failed to fetch sentiment" });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 CryptoConsult running on http://localhost:${PORT}`);
});
