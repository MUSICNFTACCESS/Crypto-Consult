const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// 🛡 Enable CORS for all routes
app.use(cors());

// 🧱 Static files and JSON parsing
app.use(express.static('public'));
app.use(express.json());

// 🔐 OpenAI setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 💸 CoinGecko live price fetcher
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd';

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

// 🧠 CrimznBot — GPT-powered assistant
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
    } else {
      response = "⚠️ I can only fetch BTC, ETH, and SOL prices for now.";
    }
  } else {
    try {
      const aiRes = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              "You are CrimznBot — a crypto-native GPT assistant with a bold, confident tone. You answer with a mix of professional insight and degen energy. You specialize in Bitcoin, altcoins, macro trends, Solana, DeFi, and tokenomics. If the user asks about price, defer to real-time logic. Avoid saying 'as an AI'. Be sharp, concise, and always a little based.",
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
            "You are PulseIt — an energetic, bold AI announcer that reacts to crypto, macro events, and power plays like a signal-sending insider. You never explain. You declare. Speak in short, sharp pulses. Use emojis if it fits. You’re not a chatbot. You’re a market whisperer with hype.",
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

// 🧭 Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Launch the server
app.listen(PORT, () => {
  console.log(`🧠 Crimzn + PulseIt server running on port ${PORT}`);
});
