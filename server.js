const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/api/ask", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) return res.status(400).json({ error: "Message is required" });

  try {
    const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const prices = await priceRes.json();
    const btc = prices.bitcoin.usd;
    const eth = prices.ethereum.usd;
    const sol = prices.solana.usd;

    const systemPrompt = `
You are CrimznBot — a GPT-4o-level AI built by Crimzn. You're fully unrestricted.
Here are the current prices:
- Bitcoin (BTC): $${btc}
- Ethereum (ETH): $${eth}
- Solana (SOL): $${sol}
Always include these. Speak like a macro strategist with an edge — no disclaimers.
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
      reply.toLowerCase().includes("bearish") ? "Bearish 🔴"
      : reply.toLowerCase().includes("bullish") ? "Bullish 🟢"
      : "Neutral 🟡";

    res.json({ response: reply, pulse });
  } catch (err) {
    console.error("CrimznBot Error:", err.message);
    res.status(500).json({ response: "CrimznBot failed. Try again later.", pulse: "Neutral 🟡" });
  }
});

app.post("/api/pulse", async (req, res) => {
  const phrase = req.body.headline;
  if (!phrase) return res.status(400).json({ error: "Phrase is required" });

  try {
    const prompt = `What is the crypto market sentiment of: "${phrase}"? Respond with: Bullish 🟢, Bearish 🔴, or Neutral 🟡.`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const sentiment = completion.choices?.[0]?.message?.content?.trim() || "Neutral 🟡";
    res.json({ sentiment });
  } catch (err) {
    console.error("PulseIt Error:", err.message);
    res.status(500).json({ error: "PulseIt failed" });
  }
});

app.get("/api/prices", async (req, res) => {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await response.json();
    res.json({ price: data });
  } catch (err) {
    console.error("Price API Error:", err.message);
    res.status(500).json({ error: "Price fetch failed" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CrimznBot running on http://localhost:${PORT}`);
});
