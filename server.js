const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// OpenAI setup (Render env var required)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Price fetcher
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ondo&vs_currencies=usd';
async function getPrice(token) {
  try {
    const res = await fetch(COINGECKO_URL);
    const data = await res.json();
    return data[token]?.usd || 'N/A';
  } catch (err) {
    console.error('❌ Error fetching price:', err.message);
    return 'N/A';
  }
}

// 🧠 CrimznBot — GPT-powered assistant + live prices
app.post('/api/message', async (req, res) => {
  const msg = req.body.message?.toLowerCase() || '';
  let response = "🤖 I'm not sure how to help with that yet.";

  if (msg.includes('price')) {
    if (msg.includes('btc')) {
      const price = await getPrice('bitcoin');
      response = `🧠 Bitcoin (BTC) is $${price}`;
    } else if (msg.includes('eth')) {
      const price = await getPrice('ethereum');
      response = `🧠 Ethereum (ETH) is $${price}`;
    } else if (msg.includes('sol')) {
      const price = await getPrice('solana');
      response = `🧠 Solana (SOL) is $${price}`;
    } else if (msg.includes('ondo')) {
      const price = await getPrice('ondo');
      response = `🧠 Ondo (ONDO) is $${price}`;
    } else {
      response = "⚠️ I can only fetch prices for BTC, ETH, SOL, and ONDO.";
    }
  } else {
    try {
      const aiRes = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              "You are CrimznBot — a crypto-native GPT assistant with a bold, confident tone. You combine professional alpha with degen insights. Speak concisely, skip filler, avoid robotic disclaimers like 'as an AI'. You're sharp, honest, and always a bit based. Specialize in Bitcoin, altcoins, macro trends, Solana, tokenomics, and real crypto knowledge.",
          },
          { role: 'user', content: msg },
        ],
        temperature: 0.7,
      });
      response = `🤖 ${aiRes.data.choices[0].message.content.trim()}`;
    } catch (err) {
      console.error('OpenAI error:', err.message);
      response = "⚠️ CrimznBot couldn't connect to OpenAI right now.";
    }
  }

  res.json({ response });
});

// 📡 PulseIt — hype announcer
app.post('/api/pulse', async (req, res) => {
  const input = req.body.message || '[no message]';

  try {
    const pulseRes = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            "You are PulseIt — a bold, rapid-fire crypto announcer bot. You react to market news, political chaos, macro shocks, and war headlines like a signal-sending insider. Speak with intensity. Use emojis if it fits. No explaining — only reacting. Short, hypey, sharp, and slightly unhinged. Be memorable.",
        },
        { role: 'user', content: input },
      ],
      temperature: 0.85,
    });

    const reaction = pulseRes.data.choices[0].message.content.trim();
    console.log(`📡 PulseIt reaction: ${reaction}`);
    res.json({ pulse: reaction });
  } catch (err) {
    console.error('PulseIt error:', err.message);
    res.json({ pulse: "⚠️ Pulse failed. Chaos is quiet... for now." });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🧠 Crimzn + PulseIt server running on port ${PORT}`);
});
