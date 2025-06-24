// 🎯 CrimznBot + PulseIt server
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');

// 🔐 OpenAI Setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// ⚙️ App Setup
const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 📊 Live Price Fetcher
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

// 🤖 CrimznBot - GPT Assistant + Price Queries
app.post('/api/message', async (req, res) => {
  const msg = req.body.message?.toLowerCase() || '';
  let response = "🤖 I'm not sure how to help with that yet.";

  if (msg.includes('price')) {
    if (msg.includes('btc')) {
      const price = await getPrice('bitcoin');
      response = `₿ Bitcoin (BTC) is currently $${price}`;
    } else if (msg.includes('eth')) {
      const price = await getPrice('ethereum');
      response = `Ξ Ethereum (ETH) is sitting at $${price}`;
    } else if (msg.includes('sol')) {
      const price = await getPrice('solana');
      response = `◎ Solana (SOL) is trading for $${price}`;
    } else if (msg.includes('ondo')) {
      const price = await getPrice('ondo');
      response = `💰 Ondo (ONDO) is valued at $${price}`;
    } else {
      response = "⚠️ I can only pull prices for BTC, ETH, SOL, and ONDO for now.";
    }
  } else {
    try {
      const aiRes = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              "You are CrimznBot, a crypto-native GPT assistant. You speak with confidence, edge, and a degen-savvy tone. You're bold, strategic, and always bring the alpha — but never give financial advice. Embrace meme culture, BTC maxis, macro trends, and market psychology. Keep it real.",
          },
          { role: 'user', content: msg },
        ],
        temperature: 0.7,
      });

      response = `🤖 ${aiRes.data.choices[0].message.content.trim()}`;
    } catch (err) {
      console.error('❌ OpenAI Error:', err.message);
      response = "⚠️ CrimznBot couldn't reach the OpenAI server right now.";
    }
  }

  res.json({ response });
});

// 📣 PulseIt - Rapid Market Reactor
app.post('/api/pulse', async (req, res) => {
  const input = req.body.message || '[No message]';

  try {
    const pulseRes = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            "You are PulseIt, a high-speed crypto hype announcer bot. Your role is to react instantly to crypto market news, war headlines, macro shocks, and political chaos like a live-streaming analyst. You're urgent, reactive, and have a sharp, no-BS tone.",
        },
        { role: 'user', content: input },
      ],
      temperature: 0.85,
    });

    const reaction = pulseRes.data.choices[0].message.content.trim();
    console.log(`📣 PulseIt: ${reaction}`);
    res.json({ pulse: reaction });
  } catch (err) {
    console.error('❌ PulseIt Error:', err.message);
    res.json({ pulse: "⚠️ Pulse failed. Markets are eerily quiet..." });
  }
});

// 🧭 Serve Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🧠 CrimznBot + 📣 PulseIt server running on port ${PORT}`);
});
