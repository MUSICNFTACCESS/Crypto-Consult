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

// 🔁 Complete token aliases
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

// 💰 Live Price Checker
async function getLivePrice(question) {
  for (const [alias, coingeckoId] of Object.entries(tokenMap)) {
    if (question.toLowerCase().includes(alias)) {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`);
        const data = await res.json();
        const price = data[coingeckoId].usd;
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
You are CrimznBot – a crypto strategist and macroeconomic analyst trained on the minds of Raoul Pal, Michael Saylor, Cathie Wood, and Warren Buffett.
You combine deep macro understanding with on-chain insight and geopolitical awareness. Your tone is confident, bold, and built for the digital age.

You speak like a professional who’s seen every market cycle. Use any live price data provided. If none is given, infer price direction.

If a user says “I don’t have live data,” it’s not explicitly provided, you triangulate it anyway like a market legend would.

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
    res.json({ answer: content });
  } catch (err) {
    console.error("❌ GPT-4o request failed:", err.message);
    res.status(500).json({ error: "GPT-4o request failed" });
  }
});

// 🧠 PulseIt Alpha Tracker — Sentiment & Insights
app.post("/pulse", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const pulsePrompt = `
Sentiment summary of recent market patterns for alpha hunters. Your job is to break down any crypto asset or macro trend with conviction.
Include real insight. Reference market structure, social buzz, ETF flows, developer momentum, or on-chain metrics when relevant.

Output MUST use this JSON format:
{ "sentiment": "[numeric range from -10 to +10]",
  "summary": "Brief insight that captures market mood and key factors"
}
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
          { role: "system", content: pulsePrompt },
          { role: "user", content: `Analyze sentiment for: ${query}` },
        ],
      }),
    });

    const raw = await response.json();
    const content = raw.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = content.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.error("❌ PulseIt sentiment request failed:", err.message);
    res.status(500).json({ error: "Sentiment analysis failed" });
  }
});

// 🔂 Optional Ping Route
app.get("/ping", (req, res) => {
  res.send("CrimznBot backend is live");
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ CrimznBot backend live @ http://localhost:${PORT}`);
});});
