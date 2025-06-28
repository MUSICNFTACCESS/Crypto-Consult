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

// ✅ CrimznBot Route (Real-Time Price + Crimzn Tone + Pulse)
app.post("/api/ask", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Message is required" });

  try {
    const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const priceData = await priceRes.json();

    const btc = priceData.bitcoin.usd;
    const eth = priceData.ethereum.usd;
    const sol = priceData.solana.usd;

    const systemPrompt = `
You are CrimznBot — a crypto-native assistant built by Crimzn.
You respond like a mix of ChatGPT-4o and a macro-degen strategist trained by Raoul Pal, Michael Saylor, and Cathie Wood.
Tone: confident, concise, strategic — with edge and occasional humor.
You ALWAYS give real-time prices like these:
- Bitcoin (BTC): $${btc}
- Ethereum (ETH): $${eth}
- Solana (SOL): $${sol}
If asked for price info, don’t say you can’t — just report the numbers above.
If asked for a crypto opinion, feel free to add macro context, ETF flows, and BTC dominance insights too.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "Try again shortly.";

    const pulse =
      reply.toLowerCase().includes("bearish")
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

// ✅ PulseIt Sentiment Analyzer (freeform headline/phrase)
app.post("/api/pulse", async (req, res) => {
  const phrase = req.body.phrase;
  if (!phrase) return res.status(400).json({ error: "Phrase is required" });

  const pulsePrompt = `You are PulseIt, a crypto-native sentiment bot. Analyze the phrase: "${phrase}" and reply with just one word: Bullish, Bearish, or Neutral.`;

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

// ✅ Live Price Endpoint (used optionally for frontend)
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

// 🔁 Root Route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ CrimznBot server listening on port ${PORT}`);
});
