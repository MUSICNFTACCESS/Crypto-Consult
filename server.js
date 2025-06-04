import express from "express";
import fetch from "node-fetch";
import OpenAI from "openai";

const app = express();
app.use(express.json());

// 🔶 Live crypto prices
app.get("/prices", async (req, res) => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
      }
    });
    const data = await response.json();
    res.json({
      btc: data?.bitcoin?.usd || "Error",
      eth: data?.ethereum?.usd || "Error",
      sol: data?.solana?.usd || "Error"
    });
  } catch (err) {
    res.status(500).json({ error: "CoinGecko fetch failed", details: err.message });
  }
});

// 🧠 CrimznBot OpenAI setup
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (err) {
  console.error("⚠️ OpenAI config failed:", err.message);
}

// 💬 CrimznBot route
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Missing message" });
  }

  if (!openai) {
    return res.json({
      reply: "CrimznBot here. My connection to GPT is down right now. Be back soon!",
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are CrimznBot, a crypto-native strategist. Be sharp, friendly, and helpful.",
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
    res.json({
      reply: "Yo, something glitched. CrimznBot will be right back — stay tuned.",
    });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot running on port ${PORT}`);
});
