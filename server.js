// 🧠 CrimznBot + 📣 PulseIt server
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

// ✅ OpenAI setup (CommonJS-friendly)
const OpenAI = require('openai');
const configuration = {
  apiKey: process.env.OPENAI_API_KEY,
};
const openai = new OpenAI(configuration);

// ⚙️ App setup
const app = express();
const PORT = process.env.PORT || 3000;

// 🧱 Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 📊 Live price fetcher
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ondo&vs_currencies=usd';

async function getPrice(token) {
  try {
    const res = await fetch(COINGECKO_URL);
    const data = await res.json();
    const tokenPrice = data[token.toLowerCase()];
    if (tokenPrice && tokenPrice.usd) {
      return `$${tokenPrice.usd}`;
    }
  } catch (err) {
    console.error("❌ Error fetching price:", err.message);
  }
  return null;
}

// 🤖 CrimznBot – GPT-powered assistant + live prices
app.post('/api/ask', async (req, res) => {
  const msg = req.body.message?.toLowerCase() || '';

  // Check for price question
  if (msg.includes('price')) {
    let response = '';
    if (msg.includes('bitcoin') || msg.includes('btc')) {
      const btc = await getPrice('bitcoin');
      response = btc ? `🟠 BTC is currently trading at ${btc}` : `BTC price unavailable.`;
    } else if (msg.includes('ethereum') || msg.includes('eth')) {
      const eth = await getPrice('ethereum');
      response = eth ? `🔵 ETH is currently trading at ${eth}` : `ETH price unavailable.`;
    } else if (msg.includes('solana') || msg.includes('sol')) {
      const sol = await getPrice('solana');
      response = sol ? `🟣 SOL is trading around ${sol}` : `SOL price unavailable.`;
    } else if (msg.includes('ondo')) {
      const ondo = await getPrice('ondo');
      response = ondo ? `💧 ONDO is at ${ondo} right now.` : `ONDO price unavailable.`;
    } else {
      response = "⚠️ I can only fetch prices for BTC, ETH, SOL, and ONDO.";
    }
    return res.json({ response });
  }

  // CrimznBot default response (chat)
  try {
    const aiRes = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are CrimznBot – a crypto-native assistant with a bold, confident tone. You combine professional alpha with degen insights. Speak with clarity, fire, and purpose. Your job is to give sharp, no-BS answers to traders, investors, and crypto-curious users. Respond with swagger and real utility.`,
        },
        { role: 'user', content: msg }
      ],
      temperature: 0.7
    });

    const reply = aiRes.choices[0].message.content.trim();
    res.json({ response: `🧠 ${reply}` });

  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.json({ response: "🚫 CrimznBot couldn't connect to OpenAI right now." });
  }
});

// 📣 PulseIt – macro/news shock announcer
app.post('/api/pulse', async (req, res) => {
  const input = req.body.message || 'no message';

  try {
    const pulseRes = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are PulseIt – a bold, rapid-fire crypto announcer bot. You react to market news, political chaos, macro shocks, and war headlines like a trader hopped on 3 espresso shots. No intro. No hesitation. Start with impact and end with fear or FOMO.`,
        },
        { role: 'user', content: input }
      ],
      temperature: 0.8
    });

    const reaction = pulseRes.choices[0].message.content.trim();
    res.json({ response: `📣 PulseIt reaction: ${reaction}` });

  } catch (err) {
    console.error("PulseIt error:", err.message);
    res.json({ response: "⚠️ Pulse failed. Chaos is quiet... for now." });
  }
});

// 🏠 Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🧠 CrimznBot + 📣 PulseIt server running on port ${PORT}`);
});
