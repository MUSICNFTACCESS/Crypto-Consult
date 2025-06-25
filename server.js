// 🧠 CrimznBot + 📣 PulseIt server
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');

// 🔐 OpenAI Setup
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

// ⚙️ App Setup
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 💸 Live Price Fetcher
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ondo&vs_currencies=usd';

async function getPrice(token) {
  try {
    const res = await fetch(COINGECKO_URL);
    const data = await res.json();
    if (!data[token]) {
      return `⚠️ ${token.toUpperCase()} price unavailable.`;
    }
    return `💰 ${token.toUpperCase()} is trading at $${data[token].usd}`;
  } catch (err) {
    return `⚠️ Couldn't fetch ${token.toUpperCase()} price.`;
  }
}

// 🧠 CrimznBot Chat with Live Prices
app.post('/api/ask', async (req, res) => {
  const msg = req.body.question || '';

  // Token cleaner
  const token = msg.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').pop().toLowerCase();

  // Check if token is in CoinGecko list
  const isToken = ['bitcoin', 'ethereum', 'solana', 'ondo'].includes(token);

  if (isToken) {
    const price = await getPrice(token);
    return res.json({ response: price });
  }

  try {
    const aiRes = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are CrimznBot — a crypto-native assistant with a bold, confident tone 🧠. You combine professional, alpha-rich insights. Speak clearly, give real answers, and avoid filler. Break market moves. Offer tips (crypto consulting, BTC dominance, on-chain trends, and bold price calls), and you know all crypto prices and if you dont you get it from a reputable source like TradingView.'
        },
        {
          role: 'user',
          content: msg
        }
      ],
      temperature: 0.7
    });

    const reply = aiRes.data.choices[0].message.content.trim();
    res.json({ response: reply });
  } catch (err) {
    console.error('CrimznBot error:', err.message);
    res.json({ response: "⚠️ CrimznBot couldn't connect to OpenAI right now." });
  }
});

// 📣 PulseIt — Market Sentiment Analyzer
app.post('/api/pulse', async (req, res) => {
  const input = req.body.message || '';

  try {
    const aiRes = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are PulseIt — a short, punchy sentiment analyzer for crypto and global markets. Reply only with: 🟢 Bullish, 🔴 Bearish, or 🟡 Neutral and a short brief sentence describing why.'
        },
        {
          role: 'user',
          content: input
        }
      ],
      temperature: 0.2
    });

    const sentiment = aiRes.data.choices[0].message.content.trim();
    res.json({ response: sentiment });
  } catch (err) {
    console.error('PulseIt error:', err.message);
    res.json({ response: '⚠️ PulseIt is unable to determine sentiment at the moment.' });
  }
});

// 🌐 Support SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🧠 CrimznBot + 📣 PulseIt server running on port ${PORT}`);
});
