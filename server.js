// 🚀 Required Modules
const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const { encodeURL } = require("@solana/pay");
const { PublicKey } = require("@solana/web3.js");
const bs58 = require("bs58");
const crypto = require("crypto");

// ✅ Use environment variable for Solana address
const SOLANA_ADDRESS = process.env.SOLANA_ADDRESS;
const HELIUS_TX_URL = process.env.HELIUS_TX_URL;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔁 Wallet Usage Tracker — Reset every hour
const walletUsage = {};
setInterval(() => {
  for (let wallet in walletUsage) {
    walletUsage[wallet] = { count: 0, hasPaid: false };
  }
  console.log("♻️ Wallet usage reset on start-up.");
}, 1000 * 60 * 60);

// 🔍 Helius Payment Verifier
async function verifyHeliusPayment(wallet) {
  try {
    const url = `${HELIUS_TX_URL}/v0/addresses/${wallet}/transactions?limit=20`;
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${process.env.HELIUS_API_KEY}` }
    });
    const data = await res.json();

    if (!Array.isArray(data)) return false;

    return data.some(tx =>
      tx.type === "TRANSFER" &&
      tx.source === wallet &&
      tx.destination === SOLANA_ADDRESS &&
      parseFloat(tx.amount) >= 0.025
    );
  } catch (err) {
    console.error("❌ Helius error:", err.message);
    return false;
  }
}

// 🤖 CrimznBot Handler — GPT-4o + Live Prices
app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;

  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };
  if (wallet === SOLANA_ADDRESS) walletUsage[wallet] = { count: 0, hasPaid: true };

  if (!walletUsage[wallet].hasPaid && walletUsage[wallet].count >= 3) {
    return res.json({ response: "⚠️ You've hit your 3-question limit. Please pay to continue." });
  }

  walletUsage[wallet].count++;

  let priceSummary = "";
  let dynamicPriceLine = "";

  try {
    const priceRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const priceData = await priceRes.json();
    const btc = priceData.bitcoin.usd;
    const eth = priceData.ethereum.usd;
    const sol = priceData.solana.usd;

    priceSummary = `Live Prices: Bitcoin $${btc}, Ethereum $${eth}, Solana $${sol}`;

    const tokenAliases = {
      btc: "bitcoin", eth: "ethereum", sol: "solana", ondo: "ondo-finance",
      jup: "jupiter-exchange", chain: "chain", pyth: "pyth-network",
      xrp: "ripple", ton: "toncoin", op: "optimism", arb: "arbitrum",
      link: "chainlink", mkr: "maker", near: "near", doge: "dogecoin",
      pepe: "pepe", people: "constitutiondao", ltc: "litecoin",
      ada: "cardano", kas: "kaspa", injective: "injective-protocol",
      sui: "sui", avax: "avalanche-2", rndr: "render-token",
      ksm: "kusama", rose: "oasis-network", stx: "stacks",
      beam: "onbeam", kda: "kadena", one: "harmony",
      icp: "internet-computer", route: "router-protocol",
      aleph: "aleph-im", rdk: "rdk", dogwifhat: "dogwifcoin"
    };

    const lowerPrompt = prompt.toLowerCase();
    const matchKey = Object.keys(tokenAliases).find(key => lowerPrompt.includes(key));
    if (matchKey) {
      const tokenId = tokenAliases[matchKey];
      const tokenRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`);
      const tokenJson = await tokenRes.json();
      const price = tokenJson[tokenId]?.usd;
      if (price) {
        dynamicPriceLine = `📈 Price for ${matchKey.toUpperCase()}: $${price}`;
      }
    }
  } catch (err) {
    console.error("❌ CoinGecko error:", err.message);
  }

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
            content: "You are CrimznBot — a fearless crypto strategist blending Raoul Pal, Michael Saylor, and a crypto degen. Be sharp, degen-leaning, and include live token prices. Never say you can't."
          },
          { role: "user", content: `Live Prices:\n${priceSummary}\n${dynamicPriceLine}` },
          { role: "user", content: prompt }
        ]
      })
    });

    const aiData = await aiRes.json();
    const reply = aiData?.choices?.[0]?.message?.content || "🤖 Sorry, no response. Try again.";
    return res.json({ response: reply });
  } catch (err) {
    console.error("❌ OpenAI error:", err.message);
    return res.json({ response: "🤖 CrimznBot error. Please try again later." });
  }
});

// 🧠 PulseIt — Sentiment Analyzer
app.post("/api/pulseit", async (req, res) => {
  const { topic } = req.body;
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
            content: "You are PulseIt, a crypto sentiment analyzer. Reply 'Bullish', 'Bearish', or 'Neutral' with a 1-line reason."
          },
          { role: "user", content: topic }
        ]
      })
    });

    const aiData = await aiRes.json();
    const raw = aiData?.choices?.[0]?.message?.content?.toLowerCase() || "";

    let sentiment = "Neutral", emoji = "🟡";
    if (raw.includes("bullish")) { sentiment = "Bullish"; emoji = "🟢"; }
    else if (raw.includes("bearish")) { sentiment = "Bearish"; emoji = "🔴"; }

    return res.json({ response: `${emoji} Sentiment: ${sentiment}` });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    return res.json({ response: "⚠️ Sentiment analysis failed. Try again." });
  }
});

// 🔐 Check Payment Status (Helius-based)
app.get("/api/check-payment", async (req, res) => {
  const wallet = req.query.wallet;
  console.log("✅ Solana Pay verification endpoint wired.");
  console.log(`🔍 Checking payment for wallet: ${wallet}`);

  const usage = walletUsage[wallet] || { hasPaid: false };
  if (!usage.hasPaid) {
    const paid = await verifyHeliusPayment(wallet);
    if (paid) {
      walletUsage[wallet] = { count: 0, hasPaid: true };
      console.log(`✅ ${wallet} has paid and was unlocked via Helius.`);
    }
  }

  res.json({ hasPaid: walletUsage[wallet]?.hasPaid || false });
});

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CrimznBot Server is live on port ${PORT}`);
});
