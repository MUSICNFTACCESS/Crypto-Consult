// 🤖 CrimznBot with Real-Time Price Logic + PulseIt Sentiment + Strategic Macro Insight
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ✅ CrimznBot Route (answer + pulse tone)
app.post("/api/ask", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Message is required" });

  const prompt = `You are CrimznBot, a crypto market expert trained by Raoul Pal, Michael Saylor, and Cathie Wood. Provide clear, accurate, forward-thinking responses using macro insight, trading logic, and crypto-native analysis. Question: ${userMessage}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content || "Couldn’t fetch a response. Try again shortly.";

    const pulse = reply.toLowerCase().includes("bearish")
      ? "Bearish 🔴"
      : reply.toLowerCase().includes("bullish")
      ? "Bullish 🟢"
      : "Neutral 🟡";

    res.json({ response: reply, pulse });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({
      response: "CrimznBot failed to fetch data. Try again later.",
      pulse: "Neutral 🟡"
    });
  }
});

// ✅ PulseIt Sentiment — freeform input (any phrase or headline)
app.post("/api/pulse", async (req, res) => {
  const phrase = req.body.phrase;
  if (!phrase) return res.status(400).json({ error: "Phrase is required" });

  const pulsePrompt = `You are PulseIt, a crypto-native market sentiment engine. Given the following word, phrase, or headline, determine if the tone is Bullish 🟢, Bearish 🔴, or Neutral 🟡: "${phrase}"`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: pulsePrompt }],
      temperature: 0.3,
    });

    const sentiment = completion.choices?.[0]?.message?.content?.trim() || "Neutral";
    res.json({ sentiment });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).json({ error: "PulseIt sentiment analysis failed" });
  }
});

// ✅ Real-Time Price API
app.get("/api/prices", async (req, res) => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await response.json();

    res.json({
      price: {
        bitcoin: data.bitcoin.usd,
        ethereum: data.ethereum.usd,
        solana: data.solana.usd,
      },
    });
  } catch (err) {
    console.error("❌ Price fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// 🔁 Root
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ CrimznBot server listening on port ${PORT}`);
});
