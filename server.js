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
          content: "You are CrimznBot, a crypto-native strategist with degen instincts and macro analysis chops.",
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
    res.json({ reply: "⚠️ CrimznBot glitch – check back in a few. If urgent, DM Crimzn." });
  }
});

// 🧠 Sentiment intelligence (POST)
app.post("/api/sentiment", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Missing 'topic' in request body" });
    }

    const prompt = `
      Analyze the current sentiment in the crypto market about "${topic}".
      Include macro factors, news tone, and emotional signals from traders.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const sentiment = response.choices?.[0]?.message?.content || "No sentiment data available.";
    res.json({ sentiment });
  } catch (error) {
    console.error("Error fetching sentiment:", error.message);
    res.status(500).json({ error: "Failed to fetch sentiment analysis." });
  }
});

// 🧠 Sentiment intelligence (GET default BTC)
app.get("/api/sentiment", async (req, res) => {
  const topic = "Bitcoin"; // fallback default
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "In 1 paragraph, summarize the current market sentiment around Bitcoin.",
        },
      ],
    });

    res.json({ topic, summary: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error fetching sentiment:", error);
    res.status(500).json({ error: "Failed to fetch sentiment." });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CrimznBot backend running on port ${PORT}`);
});
