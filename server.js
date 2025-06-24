// 🧠 CrimznBot + 📣 PulseIt server
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

// ✅ OpenAI setup (CommonJS-friendly)
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ App setup
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ✅ Live price fetcher
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ondo&vs_currencies=usd';

async function getPrice(token) {
  try {
    const res = await fetch(COINGECKO_URL);
    const data = await res.json();
    token = token.toLowerCase();
    if (!data[token]) return `${token.toUpperCase()} price unavailable.`;
    return `💰 ${token.toUpperCase()} is trading at $${data[token].usd}`;
  } catch (err) {
    console.error('⚠️ Error fetching price:', err.message);
    return `⚠️ Couldn't fetch ${token.toUpperCase()} price.`;
  }
}

// ✅ CrimznBot: GPT-powered assistant + live prices
app.post('/api/chat', async (req, res) => {
  const msg = req.body.message || '';
  let response = '';

  // 🔄 Live price logic
  if (msg.toLowerCase().includes('btc')) {
    response = await getPrice('bitcoin');
    return res.json({ response });
  }
  if (msg.toLowerCase().includes('eth')) {
    response = await getPrice('ethereum');
    return res.json({ response });
  }
  if (msg.toLowerCase().includes('sol')) {
    response = await getPrice('solana');
    return res.json({ response });
  }
  if (msg.toLowerCase().includes('ondo')) {
    response = await getPrice('ondo');
    return res.json({ response });
  }

  try {
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are CrimznBot — a crypto-native assistant with a bold, confident tone. 
You combine professional alpha with degen insights. Speak clearly, give real answers, and avoid filler. 
Focus on market moves, wallet tips, crypto consulting, BTC dominance, on-chain trends, and bold price calls.`
        },
        { role: 'user', content: msg }
      ],
      temperature: 0.7,
    });

    const reply = aiRes.choices[0].message.content.trim();
    res.json({ response: reply });
  } catch (err) {
    console.error('🧠 CrimznBot error:', err.message);
    res.json({ response: "🧠 CrimznBot couldn't connect to OpenAI right now." });
  }
});

// 📣 PulseIt — market sentiment analyzer
app.post('/api/pulse/news', async (req, res) => {
  const input = req.body.message || 'No input provided.';

  try {
    const pulseRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are PulseIt — a short, punchy sentiment analyzer for crypto and global markets.
Given a topic, classify it as Bullish 🟢, Bearish 🔴, or Neutral 🟡 and respond with:

1. One-line summary.
2. Sentiment label: Bullish, Bearish, or Neutral.
3. Icon matching the tone.

Be confident and concise.`
        },
        { role: 'user', content: input }
      ],
      temperature: 0.5,
    });

    const analysis = pulseRes.choices[0].message.content.trim();
    res.json({ response: analysis });
  } catch (err) {
    console.error('📣 PulseIt error:', err.message);
    res.json({ response: '📣 PulseIt is unable to determine sentiment at the moment.' });
  }
});

// 🔁 Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🧠 CrimznBot + 📣 PulseIt server running on port ${PORT}`);
});
