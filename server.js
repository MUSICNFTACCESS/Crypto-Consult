const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const app = express();
app.use(express.static("public"));
app.use(express.json());

const { OpenAI } = require("openai");
const openai = new OpenAI();

// 🤖 CrimznBot — Real-Time Crypto Assistant with Extended Token Alias Support
app.post("/api/ask", async (req, res) => {
  const question = (req.body.question || req.body.message || "").toLowerCase().trim();
  if (!question) return res.status(400).json({ response: "No question provided." });

  const tokenMap = {
    btc: "bitcoin", bitcoin: "bitcoin", "btc-usd": "bitcoin",
    eth: "ethereum", ethereum: "ethereum", "eth-usd": "ethereum",
    sol: "solana", solana: "solana", "sol-usd": "solana",
    link: "chainlink", "chainlink": "chainlink",
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
    bonk: "bonk", "bonk-token": "bonk",
    render: "render-token", rndr: "render-token",
    sui: "sui", sui-token: "sui",
    wif: "dogwifhat", dogwifhat: "dogwifhat",
    usdt: "tether", tether: "tether",
    usdc: "usd-coin", "usd-coin": "usd-coin",
    tip: "tipcoin", tipcoin: "tipcoin",
    jto: "jito", jito: "jito",
    ray: "raydium", raydium: "raydium"
  };

  const match = Object.keys(tokenMap).find(key => question.includes(key));
  const tokenId = match ? tokenMap[match] : null;

  if (tokenId) {
    try {
      const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`);
      if (!cgRes.ok) throw new Error(`Coingecko error: ${cgRes.status}`);
      const data = await cgRes.json();
      const price = data[tokenId]?.usd;
      if (price) {
        return res.json({ response: `The current price of **${match.toUpperCase()}** is **$${price.toLocaleString()} USD**.` });
      }
    } catch (err) {
      console.error("🟥 Coingecko failed, falling back to GPT:", err.message);
    }
  }

  // 🧠 GPT-4o fallback if no price or token found
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are CrimznBot — a sharp crypto-native AI built into CryptoConsult.
Answer with clarity, brevity, and confidence.
If the user asks about crypto prices or markets, be precise.
If price data is missing, just say so — never guess or hallucinate.
          `.trim()
        },
        {
          role: "user",
          content: question
        }
      ]
    });

    const reply = chatCompletion.choices?.[0]?.message?.content || "No response.";
    res.json({ response: reply });
  } catch (error) {
    console.error("⚠️ GPT-4o fallback failed:", error.message);
    res.status(500).json({ response: "⚠️ CrimznBot backend error. Please try again." });
  }
});

// 📣 PulseIt (Sentiment analysis tool)
app.post("/api/pulseit", async (req, res) => {
  const topic = (req.body.topic || "").toLowerCase().trim();
  if (!topic) return res.status(400).json({ explanation: "No topic provided." });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are PulseIt — a fast crypto sentiment AI.
Reply with 1 line only in this format:
[Sentiment emoji] — [Short explanation].
Be bold. Use emojis: 🟢 Bullish, 🔴 Bearish, 🟡 Neutral.
Never add extra text or greetings.
          `.trim()
        },
        {
          role: "user",
          content: `Sentiment analysis: ${topic}`
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "Neutral 🟡 — No signal.";
    const [sentiment, ...rest] = raw.split("—");
    res.json({
      sentiment: (sentiment || "").trim(),
      explanation: (rest.join("—") || "").trim()
    });
  } catch (error) {
    console.error("PulseIt error:", error.message);
    res.status(500).json({
      sentiment: "Offline",
      explanation: "PulseIt backend error."
    });
  }
});

// 📈 Live price API for frontend polling
app.get("/api/prices", async (req, res) => {
  try {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd";
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Price API error:", error.message);
    res.status(500).json({ error: "Failed to fetch live prices." });
  }
});

// 🔓 Solana payment unlock check (via Helius API)
app.get("/api/check-solana-payment", async (req, res) => {
  const HELIUS_URL = process.env.HELIUS_TX_URL;
  if (!HELIUS_URL) return res.status(500).json({ error: "Missing Helius URL" });

  try {
    const response = await fetch(HELIUS_URL);
    const data = await response.json();

    const paid = Array.isArray(data) && data.some(tx =>
      tx?.type === "TRANSFER" &&
      tx?.nativeTransfers?.some(n =>
        n.toUserAccount === "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF" &&
        n.amount >= 25000000 // 0.025 SOL in lamports
      )
    );

    res.json({ unlocked: paid });
  } catch (err) {
    console.error("Helius check error:", err.message);
    res.status(500).json({ error: "Failed to check Solana payment" });
  }
});

// 🌐 Start server
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});
app.listen(PORT, () => {
  console.log(`CryptoConsult backend running on port ${PORT}`);
});
