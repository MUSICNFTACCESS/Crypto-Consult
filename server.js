const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(express.json());

// 🟠 Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// 🟠 Root route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 💰 Price Route
app.get("/prices", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
      }
    );
    const data = await response.json();
    res.json({
      btc: data.bitcoin?.usd || "Error",
      eth: data.ethereum?.usd || "Error",
      sol: data.solana?.usd || "Error",
    });
  } catch (err) {
    console.error("CoinGecko fetch failed:", err.message);
    res.json({ btc: "Error", eth: "Error", sol: "Error" });
  }
});

// 🧠 OpenAI Setup
let openai;
try {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
} catch (err) {
  console.error("⚠️ OpenAI config failed:", err.message);
}

// 🤖 CrimznBot Chat Route
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: "Missing message" });
  }

  if (!openai) {
    return res.json({
      reply: "CrimznBot here. My connection to GPT is down right now. Be right back.",
    });
  }

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot, a crypto-native strategist with real-time knowledge.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.json({
      reply: "⚠️ CrimznBot glitch – check back in a few. If urgent, contact support.",
    });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot backend running on port ${PORT}`);
});
