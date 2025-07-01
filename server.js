const path = require("path");
const app = require("express")();
require("dotenv").config();

const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(require("express").static("public"));
app.use(require("express").json());

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_TX_URL = process.env.HELIUS_TX_URL;
const SOLANA_ADDRESS = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";

// ✅ CrimznBot — Crypto Price + GPT-4 Hybrid AI
app.post("/api/crimznbot", async (req, res) => {
  const question = (req.body.prompt || req.body.question || req.body.message || "").toLowerCase();
  if (!question) return res.status(400).json({ response: "No question provided." });

  const tokenMap = {
    btc: "bitcoin", bitcoin: "bitcoin", "btc-usd": "bitcoin",
    eth: "ethereum", ethereum: "ethereum", "eth-usd": "ethereum",
    sol: "solana", solana: "solana", "sol-usd": "solana",
    link: "chainlink", chainlink: "chainlink",
    jup: "jupiter-exchange", jupiter: "jupiter-exchange",
    mstr: "microstrategy", microstrategy: "microstrategy",
    stx: "stacks", stacks: "stacks",
    py: "pyth-network", pyth: "pyth-network",
    ondo: "ondo-finance", "ondo-finance": "ondo-finance",
    ldo: "lido-dao", lido: "lido-dao",
    metaplanet: "metaplanet",
    arb: "arbitrum", arbitrum: "arbitrum",
    op: "optimism", optimism: "optimism",
    avax: "avalanche-2", avalanche: "avalanche-2",
    doge: "dogecoin", dogecoin: "dogecoin",
    pepe: "pepe", "pepe-coin": "pepe",
    bonk: "bonk", "bonk-token": "bonk"
  };

  const matchedToken = Object.keys(tokenMap).find(key => question.includes(key));
  const tokenId = matchedToken ? tokenMap[matchedToken] : null;

  if (tokenId) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`;
      const priceRes = await fetch(url);
      const priceData = await priceRes.json();
      const usd = priceData[tokenId]?.usd;

      if (usd) {
        return res.json({
          response: `🟢 ${tokenId.toUpperCase()} is currently $${usd.toLocaleString()}.`
        });
      }
    } catch (err) {
      console.error("Price fetch error:", err.message);
      return res.status(500).json({ response: "💥 Error fetching price data." });
    }
  }

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are CrimznBot — a sharp, degen-friendly crypto strategist with the mind and insights of Raoul Pal, Michael Saylor, and Cathie Wood. Respond with market-savvy insight, a casual but professional tone, and a touch of sarcasm or alpha drop when needed. Be direct. Never say you lack real-time data.`
        },
        {
          role: "user",
          content: question
        }
      ]
    });

    const reply = chat.choices?.[0]?.message?.content || "🤖 CrimznBot is offline.";
    res.json({ response: "🟢 " + reply });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ response: "❌ CrimznBot failed to respond." });
  }
});

// ✅ PulseIt — Market News Sentiment Classifier
app.post("/api/pulseit", async (req, res) => {
  const input = req.body.input;
  if (!input) {
    return res.status(400).json({
      sentiment: "neutral",
      emoji: "🟠",
      explanation: "No input provided."
    });
  }

  try {
    // 🎯 Classify sentiment
    const classify = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are PulseIt — a crypto sentiment oracle. Respond with ONE WORD ONLY: bullish, bearish, or neutral. No punctuation. No extra text.`
        },
        { role: "user", content: input }
      ],
      temperature: 0.5
    });

    const sentiment = classify.choices?.[0]?.message?.content.trim().toLowerCase();
    let emoji = "🟠";
    if (sentiment.includes("bullish")) emoji = "🟢";
    else if (sentiment.includes("bearish")) emoji = "🔴";

    // 🧠 Generate punchy explanation
    const explain = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are PulseIt — a spicy, concise crypto analyst. Explain the sentiment behind the news in ONE short, punchy sentence. No fluff, just signal.`
        },
        { role: "user", content: input }
      ],
      temperature: 0.8
    });

    const explanation = explain.choices?.[0]?.message?.content.trim();

    res.json({
      sentiment,
      emoji,
      explanation
    });

  } catch (err) {
    console.error("PulseIt error:", err.message);
    res.status(500).json({
      sentiment: "neutral",
      emoji: "🟠",
      explanation: "AI error while analyzing sentiment."
    });
  }
});

// ✅ Solana Pay unlock verifier
app.post("/api/verify", async (req, res) => {
  const wallet = req.body.wallet;
  if (!wallet) return res.status(400).json({ paid: false, message: "No wallet provided." });

  if (!HELIUS_TX_URL || !HELIUS_API_KEY) {
    console.error("Missing env vars:", { HELIUS_TX_URL, HELIUS_API_KEY });
    return res.status(500).json({ paid: false, error: "Helius config missing" });
  }

  const heliusURL = `${HELIUS_TX_URL}/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=10`;
  console.log("🔍 Checking payments via:", heliusURL);

  try {
    const txRes = await fetch(heliusURL);
    const txData = await txRes.json();

    const hasPaid = txData?.some(tx =>
      tx.description === "transfer" &&
      tx.transfers?.some(t =>
        t.to === SOLANA_ADDRESS &&
        parseFloat(t.amount || 0) >= 0.025
      )
    );

    res.json({ paid: hasPaid });
  } catch (err) {
    console.error("Helius error:", err.message);
    res.status(500).json({ paid: false, error: "Failed to check payment." });
  }
});

// ✅ Fallback route — serve index.html for all unmatched routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server live on http://localhost:${PORT}`);
});
