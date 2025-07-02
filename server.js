// 🔐 Required modules
const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const { encodeURL } = require("@solana/pay");
const { PublicKey } = require("@solana/web3.js");
const BigNumber = require("bignumber.js");
const bs58 = require("bs58");
const crypto = require("crypto");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🧠 Wallet usage tracker
const walletUsage = {};
setTimeout(() => {
  for (let wallet in walletUsage) {
    walletUsage[wallet] = { count: 0, hasPaid: false };
  }
  console.log("🔁 Wallet usage reset on startup.");
}, 1000);

// 🤖 CrimznBot handler
app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;
  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

  if (!walletUsage[wallet].hasPaid && walletUsage[wallet].count >= 3) {
    return res.json({ response: "🟡 You've hit your 3-question limit. Please pay to continue." });
  }

  walletUsage[wallet].count++;

  try {
    const coingeckoRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd`);
    const priceData = await coingeckoRes.json();
    const priceSummary = `Live Prices: Bitcoin $${priceData.bitcoin.usd}, Ethereum $${priceData.ethereum.usd}, Solana $${priceData.solana.usd}`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
  messages: [
  {
    role: "system",
    content: `You are CrimznBot — a fearless crypto strategist combining the minds of Raoul Pal, Michael Saylor, and Cathie Wood. Respond with bold macro commentary, conviction, and market insight. Do NOT ever say you're an AI or refer users to other tools. Live token prices will be injected.`
  },
  {
    role: "user",
    content: `Live Prices:\n${priceSummary}`
  },
  {
    role: "user",
    content: prompt
  }
]
const aiData = await aiRes.json();
let output = aiData.choices?.[0]?.message?.content || "⚠️ No response.";
output = output
  .replace(/As an AI language model,? ?/gi, "")
  .replace(/I (cannot|can't|do not|don’t) (predict|provide|guarantee)[^.]*\./gi, "")
  .replace(/I'm just a language model[^.]*\./gi, "")
  .replace(/As an artificial intelligence[^.]*\./gi, "");

res.json({ response: output });
    res.json({ response: output });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ response: "⚠️ AI error." });
  }
});

// 📣 PulseIt — Sentiment Analyzer
app.post("/api/pulseit", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ sentiment: "⚠️ No topic provided." });

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are PulseIt — a fast, opinionated crypto sentiment engine. Output sentiment as one of: Bullish 🟢, Bearish 🔴 or Neutral 🟡. Be blunt and clear.`
          },
          {
            role: "user",
            content: `Give sentiment for: ${topic}`
          }
        ]
      })
    });

    const data = await aiRes.json();
    const sentiment = data.choices?.[0]?.message?.content || "⚠️ No sentiment generated.";
    res.json({ sentiment });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).json({ sentiment: "⚠️ Sentiment analysis failed." });
  }
});

// ✅ Check payment status (in-memory logic)
app.get("/api/check-payment", async (req, res) => {
  const wallet = req.query.wallet;
  const paid = walletUsage[wallet]?.hasPaid || false;
  res.json({ hasPaid: paid });
});

// 💸 Solana Pay link generator
app.get("/api/solana-pay-link", async (req, res) => {
  try {
    const wallet = req.query.wallet;
    if (!wallet) return res.status(400).json({ error: "Wallet is required." });

    const recipient = new PublicKey("Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF");
    const amount = new BigNumber(0.025);

    const hash = crypto.createHash("sha256").update(wallet + Date.now()).digest();
    const reference = new PublicKey(bs58.encode(hash.slice(0, 32)));

    const label = "CryptoConsult";
    const message = "Unlock CrimznBot";

    const url = encodeURL({ recipient, amount, reference, label, message });
    res.json({ url: url.toString() });
  } catch (err) {
    console.error("Solana Pay link error:", err.message);
    res.status(500).json({ error: "Solana Pay generation failed." });
  }
});

// 🪝 Webhook from Helius
app.post("/api/webhook", async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events)) return res.sendStatus(400);

    for (const event of events) {
      const txAmount = event.amount || 0;
      const payer = event?.payer || event?.sender;
      const recipient = event?.account || "";

      if (
        txAmount === 25000000 &&
        recipient === "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF" &&
        payer
      ) {
        console.log(`✅ Verified payment from ${payer}`);
        walletUsage[payer] = { hasPaid: true, count: 0 };
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.sendStatus(500);
  }
});

// 🔥 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
