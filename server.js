// 🔧 CrimznBot + PulseIt server
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ⚙️ App setup
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 📈 Live Prices Middleware
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ondo&vs_currencies=usd';

async function getPrice(token) {
  try {
    const res = await fetch(COINGECKO_URL);
    const data = await res.json();
    if (!data[token]) throw new Error(`${token} price unavailable.`);
    return `💰 ${token.toUpperCase()} is trading at $${data[token].usd}`;
  } catch (err) {
    console.error('❌ Error fetching price:', err.message);
    return `⚠️ Couldn't fetch ${token.toUpperCase()} price.`;
  }
}

// 🤖 CrimznBot — GPT-powered assistant + live prices
app.post("/api/ask", async (req, res) => {
  const msg = req.body.question;
  let response = '';

  // Live price logic
  if (msg.toLowerCase().includes("price of")) {
    const token = msg.split("price of")[1].trim().toLowerCase();
    const priceMsg = await getPrice(token);
    return res.json({ response: priceMsg });
  }

  // ChatGPT logic
  try {
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are CrimznBot — a crypto-native assistant with a bold, confident tone 🧠.
You combine professional alpha with degen insights. Speak clearly, give real answers, and avoid filler.
Focus on expert moves, wallet tips, crypto consulting, BTC dominance, on-chain trends, and bold price calls.`,
        },
        { role: 'user', content: msg }
      ],
      temperature: 0.7
    });

    const reply = aiRes.choices[0].message.content.trim();
    response = reply;
  } catch (err) {
    console.error('CrimznBot error:', err.message);
    response = "❌ CrimznBot couldn't connect to OpenAI right now.";
  }

  res.json({ response });
});

// 🔮 PulseIt — market sentiment analyzer
app.post("/api/pulse", async (req, res) => {
  const input = req.body.message || "no input provided.";
  let sentiment = '';

  try {
    const pulse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are PulseIt — a short, punchy sentiment analyzer for crypto and global markets.
You only return: Bullish 🟢, Bearish 🔴, or Neutral 🟡 and respond with the sentiment only.`,
        },
        { role: 'user', content: input }
      ],
      temperature: 0.1
    });

    sentiment = pulse.choices[0].message.content.trim();
  } catch (err) {
    console.error('PulseIt error:', err.message);
    sentiment = "❌ PulseIt is unable to determine sentiment at the moment.";
  }

  res.json({ response: sentiment });
});

// 🎯 Final route: index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🧠 CrimznBot + 📣 PulseIt server running on port ${PORT}`);
});
