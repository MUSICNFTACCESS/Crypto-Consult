const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔁 Token aliases for live price fetching
const tokenMap = {
  bitcoin: "bitcoin", btc: "bitcoin",
  ethereum: "ethereum", eth: "ethereum",
  solana: "solana", sol: "solana",
  avalanche: "avalanche-2", avax: "avalanche-2",
  chainlink: "chainlink", link: "chainlink",
  cardano: "cardano", ada: "cardano",
  dogecoin: "dogecoin", doge: "dogecoin",
  shiba: "shiba-inu", shib: "shiba-inu",
  polkadot: "polkadot", dot: "polkadot",
  ripple: "ripple", xrp: "ripple",
  pepe: "pepe",
  injective: "injective-protocol", inj: "injective-protocol",
  litecoin: "litecoin", ltc: "litecoin",
  aptos: "aptos", apt: "aptos",
  near: "near",
  uniswap: "uniswap", uni: "uniswap",
  arbitrum: "arbitrum", arb: "arbitrum",
  optimism: "optimism", op: "optimism",
  cosmos: "cosmos", atom: "cosmos",
  ton: "the-open-network", toncoin: "the-open-network",
  render: "render-token", rndr: "render-token",
  manta: "manta-network", sui: "sui",
  stx: "stacks", stacks: "stacks",
  beam: "beam",
  kaspa: "kaspa", kas: "kaspa",
  lido: "lido-dao", ldo: "lido-dao",
  frax: "frax", fx: "frax-share"
};

// 💰 Live price fetcher
async function getLivePrice(question) {
  for (const [alias, coingeckoId] of Object.entries(tokenMap)) {
    if (question.toLowerCase().includes(alias)) {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`);
        const data = await res.json();
        const price = data[coingeckoId]?.usd;
        return `The current price of ${alias.toUpperCase()} is $${price}.`;
      } catch (err) {
        return null;
      }
    }
  }
  return null;
}

// 🤖 CrimznBot — GPT-4o Macro Crypto Strategist
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  const livePriceNote = await getLivePrice(question);

  const systemPrompt = `
You are CrimznBot – a crypto strategist and macroeconomic analyst trained on the minds of Raoul Pal, Michael Saylor, Cathie Wood, and Elon Musk.
You combine deep macro understanding with on-chain insight and geopolitical awareness. Your tone is sharp, confident, and grounded in real-world market structure.

You speak like a professional who’s seen every market cycle. Use any live price data provided. If none, triangulate from macro cues.

Avoid saying "as an AI..." — instead, deliver with authority like Raoul would in a Real Vision interview.

This is not financial advice — this is Crimzn-level alpha.

${livePriceNote ? `Live price: ${livePriceNote}` : ""}
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "No response";
    res.json({ response: content });

  } catch (err) {
    console.error("CrimznBot error:", err.message);
    res.status(500).json({ error: "CrimznBot failed." });
  }
});

// 📊 PulseIt+ — Market Sentiment Analyzer
app.post("/pulseit", async (req, res) => {
  const { message } = req.body;

  const pulsePrompt = `
You are PulseIt+, a market sentiment classifier. Analyze the user input and reply with one of:
🟢 Bullish
🔴 Bearish
⚪️ Neutral

NO explanations. Just sentiment.

Message: "${message}"
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: pulsePrompt }
        ],
        temperature: 0,
      }),
    });

    const data = await response.json();
    const sentiment = data?.choices?.[0]?.message?.content?.trim() || "⚪️ Neutral";
    res.json({ response: sentiment });

  } catch (err) {
    console.error("PulseIt+ error:", err.message);
    res.status(500).json({ error: "PulseIt+ failed." });
  }
});

// ✅ Serve radar.html without caching
app.get('/radar.html', (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); // 🔁 Disable cache
  res.sendFile(path.join(__dirname, 'public', 'radar.html'));
});

app.listen(PORT, () => {
  console.log(`CryptoConsult backend running on port ${PORT}`);
});
