const express = require("express");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { OpenAI } = require("openai");

const app = express();
const PORT = 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

// 🧠 CrimznBot Chat Endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are CrimznBot, a strategic crypto expert with live market knowledge and a degen edge." },
        { role: "user", content: userMessage }
      ]
    });

    res.json({ reply: chat.choices[0].message.content });
  } catch (err) {
    console.error("❌ Chat error:", err.message);
    res.status(500).json({ error: "Chat error" });
  }
});

// 📈 Real-Time Prices with GPT Fallback
app.get("/prices", async (req, res) => {
  try {
    const cgResponse = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await cgResponse.json();

    res.json({
      btc: data.bitcoin.usd,
      eth: data.ethereum.usd,
      sol: data.solana.usd
    });
  } catch (err) {
    console.error("❌ CoinGecko API failed:", err.message);

    try {
      const fallback = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a fallback price oracle. Return BTC, ETH, and SOL prices in realistic USD values as JSON." },
          { role: "user", content: "What are the prices of BTC, ETH, and SOL right now?" }
        ]
      });

      const parsed = JSON.parse(fallback.choices[0].message.content);
      res.json({
        btc: parsed.btc || "Error",
        eth: parsed.eth || "Error",
        sol: parsed.sol || "Error"
      });
    } catch (fallbackErr) {
      console.error("❌ GPT Fallback failed:", fallbackErr.message);
      res.json({ btc: "Error", eth: "Error", sol: "Error" });
    }
  }
});

// 🧠 Sentiment Analyzer
app.post("/api/sentiment", async (req, res) => {
  try {
    const query = req.body.query;

    const sentiment = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert crypto sentiment analyst. Return a JSON object with:
- sentiment_score (1–10),
- summary (1 sentence),
- tags (1–3 keywords).`
        },
        { role: "user", content: `Analyze market sentiment on: ${query}` }
      ]
    });

    res.json(JSON.parse(sentiment.choices[0].message.content));
  } catch (err) {
    console.error("❌ GPT sentiment failed:", err.message);
    res.status(500).json({ error: "GPT sentiment failed." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 CrimznBot backend running on http://localhost:${PORT}`);
});
