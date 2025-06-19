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

async function getLivePrice(question) {
  const q = question.toLowerCase();
  for (const [alias, coingeckoId] of Object.entries(tokenMap)) {
    if (q.includes(alias)) {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`);
        const data = await res.json();
        const price = data?.[coingeckoId]?.usd;
        return price ? `The current price of ${alias.toUpperCase()} is $${price}. Inject this into your response naturally and build insight around it.` : "";
      } catch {
        return "";
      }
    }
  }
  return "";
}

// 🧠 CrimznBot — GPT-4o macro crypto strategist
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  const livePriceNote = await getLivePrice(question);

  const systemPrompt = `
You are CrimznBot — a crypto strategist and macroeconomic analyst trained on the minds of Raoul Pal, Michael Saylor, Cathie Wood, Warren Buffett, and the greatest thinkers in financial history.

You combine deep macro understanding with on-chain insight and geopolitical awareness. Your tone is confident, bold, and built for the edge. You don’t hedge. You don’t apologize. You deliver conviction, clarity, and signal — not noise.

You speak like a professional who's seen every market cycle. Use any live price data provided. If none is given, infer the price direction and sentiment from macro trends, recent volatility, ETF flows, token-specific narratives, and CoinMarketCap, CoinGecko, or another reputable source.

You never say “I don’t have live data.” If it’s not explicitly provided, you triangulate it anyway like a market legend would.

This is not financial advice — this is Crimzn-level alpha.
${livePriceNote}
`.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "No response";
    res.json({ answer });
  } catch (err) {
    console.error("❌ GPT-4o request failed:", err.message);
    res.status(500).json({ answer: null, error: "GPT-4o request failed" });
  }
});

// 📊 PulseIt Alpha Tracker — Sentiment & Insights
app.post("/sentiment", async (req, res) => {
  const query = req.body.query;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const pulsePrompt = `
You are PulseIt — a sentiment analyzer designed for alpha hunters. Your job is to break down any crypto asset or macro trend with conviction.

Sentiment score must reflect momentum, risk appetite, and social/institutional tone on a scale from -10 (very bearish) to +10 (very bullish).

Output MUST be in this JSON format:
{
  "sentiment_score": "[number from -10 to +10]",
  "summary": "[brief insight that captures market mood and key factors]"
}

Include real insight. Reference market structure, social buzz, ETF flows, developer momentum, or on-chain metrics when relevant.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: pulsePrompt },
          { role: "user", content: `Analyze sentiment for: ${query}` }
        ]
      })
    });

    const raw = await response.json();
    const content = raw.choices?.[0]?.message?.content?.trim() || "";
    const cleaned = content.replace(/^```json|```$/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("❌ Failed to parse AI response:", cleaned);
      return res.status(500).json({ sentiment_score: "N/A", summary: "Parsing failed" });
    }

    res.json({
      sentiment_score: parsed.sentiment_score || "N/A",
      summary: parsed.summary || "N/A"
    });

  } catch (err) {
    console.error("❌ Sentiment fetch failed:", err.message);
    res.status(500).json({ sentiment_score: "N/A", summary: "Error occurred" });
  }
});

app.listen(PORT, () => {
  console.log(`🟢 CrimznBot backend live at http://localhost:${PORT}`);
});
