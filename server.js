// 🤖 CrimznBot with Real-Time Price Logic + PulseIt Sentiment
const express = require("express");
const fetch = require("node-fetch");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public")); // Serves index.html + frontend

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
console.log("🔐 OPENAI_API_KEY Loaded:", process.env.OPENAI_API_KEY ? "✅ Present" : "❌ MISSING");

// 🧠 CrimznBot AI + Price Logic
app.post("/api/ask", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  const lowerMsg = message.toLowerCase();
  const tokens = [
    "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "ondo", "link", "ena", "pepe", "doge",
    "dot", "avax", "matic", "ada", "ton", "xrp", "xlm", "shib", "uni", "ltc", "atom", "near", "apt",
    "arb", "op", "kaspa", "inj", "fet", "gala", "render", "snx", "pyth", "sui", "beam", "mina",
    "axl", "joe", "stx", "blur", "jup", "mantra", "celestia", "ocean", "zil", "metis", "radix", "hnt",
    "bsv", "fil", "zec", "ckb", "lrc", "yfi", "1inch", "comp", "bat", "enj", "woo", "cake", "chz",
    "bal", "band", "dydx", "nexo", "rune", "rndr", "lido", "sxp", "hbar", "icp", "egld", "grt", "dai",
    "usdt", "usdc", "fdusd", "tusd", "frax", "rai", "gusd"
  ];

  const found = tokens.find(t => lowerMsg.includes(t) && lowerMsg.includes("price"));

  if (found) {
    try {
      const id = found;
      const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      const priceData = await priceRes.json();
      const price = priceData[id]?.usd;

      if (price) {
        return res.json({
          response: `🔹 The current price of ${found.toUpperCase()} is **$${price.toLocaleString()} USD**.`
        });
      } else {
        throw new Error("Price not available");
      }
    } catch (err) {
      console.error("Price fetch error:", err.message);
      return res.status(500).json({ error: "Failed to get live price." });
    }
  }

  // Fallback to GPT
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are CrimznBot, a sharp, degen-savvy crypto consultant. Give concise, accurate answers. If the question isn't about price, respond with professional but edgy tone. NEVER make up prices. Channel insights from Raoul Pal, Michael Saylor, and Cathie Wood."
        },
        { role: "user", content: message }
      ],
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content.trim();
    return res.json({ response: reply });
  } catch (err) {
    console.error("GPT fallback error:", err.message);
    return res.status(500).json({ error: "CrimznBot failed to respond." });
  }
});

// 📣 PulseIt — Market Sentiment Analyzer
app.post("/api/pulse", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    const pulse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are PulseIt, a sentiment scanner. Read a message and classify it as 'Bullish', 'Bearish', or 'Neutral'. Output a JSON response with:\n\n- sentiment: 'Bullish' | 'Bearish' | 'Neutral'\n- icon: 🟢 | 🔴 | 🟡\n- summary: short phrase why\n\nRespond ONLY with the JSON."
        },
        { role: "user", content: message }
      ],
      temperature: 0.4
    });

    const output = pulse.choices[0].message.content.trim();
    const match = output.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("Invalid format");

    const result = JSON.parse(match[0]);
    return res.json(result);
  } catch (err) {
    console.error("PulseIt error:", err.message);
    return res.status(500).json({ error: "PulseIt failed to classify sentiment." });
  }
});

// 🔁 Serve index.html for root route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CrimznBot server listening on port ${PORT}`);
});

