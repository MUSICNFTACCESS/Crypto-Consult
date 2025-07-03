// 🚀 Required Modules
const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const { encodeURL } = require("@solana/pay");
const { PublicKey } = require("@solana/web3.js");
const bs58 = require("bs58");
const crypto = require("crypto");
const QRCode = require("qrcode");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔁 Wallet Usage Tracker
const walletUsage = {};
setInterval(() => {
  for (let wallet in walletUsage) {
    walletUsage[wallet] = { count: 0, hasPaid: false };
  }
  console.log("♻️ Wallet usage reset on start-up.");
}, 1000 * 60 * 60);

// 🤖 CrimznBot Handler — 🔥 DYNAMIC TOKEN PRICE + TONE
app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;

  const CRIMZN_WALLET = process.env.SOLANA_ADDRESS;
  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

  if (wallet === CRIMZN_WALLET) {
    walletUsage[wallet].hasPaid = true;
    walletUsage[wallet].count = 0;
  }

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
      const price = tokenJson[tokenId].usd;
      if (price) dynamicPriceLine = `📈 Price for ${matchKey.toUpperCase()}: $${price}`;
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
            content: "You are CrimznBot — a fearless crypto strategist combining the minds of Raoul Pal, Michael Saylor, and Cathie Wood. You always provide clear insights with price context and strong conviction."
          },
          {
            role: "user",
            content: `Live Prices:\n${priceSummary}\n${dynamicPriceLine}`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const aiData = await aiRes.json();
    const output = aiData.choices?.[0]?.message?.content || "⚠️ No response.";
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
            content: "You are PulseIt — a fast, opinionated crypto sentiment engine. Output: Bullish 🟢 Bearish 🔴 or Neutral 🟡 with 1-line justification."
          },
          {
            role: "user",
            content: `Give sentiment for: ${topic}`
          }
        ]
      })
    });

    const aiData = await aiRes.json();
    const output = aiData.choices?.[0]?.message?.content || "⚠️ No sentiment generated.";
    res.json({ sentiment: output });
  } catch (err) {
    console.error("❌ PulseIt error:", err.message);
    res.status(500).json({ sentiment: "⚠️ Sentiment analysis failed." });
  }
});

// ✅ Check Payment Status
app.get("/api/check-payment", (req, res) => {
  const wallet = req.query.wallet;
  const isPaid = walletUsage[wallet]?.hasPaid || false;
  res.json({ hasPaid: isPaid });
});

// 💸 Solana Pay Link Generator with optional QR
app.get("/api/solana-pay-link", async (req, res) => {
  const { wallet, qr } = req.query;
  if (!wallet) return res.status(400).json({ error: "Wallet is required." });

  const recipient = new PublicKey("Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF");
  const amount = 0.025;

  const hash = crypto.createHash("sha256").update(wallet + Date.now()).digest();
  const reference = new PublicKey(bs58.encode(hash.slice(0, 32)));

  const label = "CryptoConsult";
  const message = "Unlock CrimznBot";

  try {
    const url = encodeURL({ recipient, amount, reference, label, message }).toString();

    if (qr === "true") {
      const qrImage = await QRCode.toDataURL(url);
      return res.json({ qr: qrImage, url });
    }

    res.json({ url });
  } catch (err) {
    console.error("❌ Solana Pay link/QR error:", err.message);
    res.status(500).json({ error: "Solana Pay link or QR generation failed." });
  }
});

// 📡 Helius Webhook — Payment Confirmation
app.post("/api/webhook", async (req, res) => {
  const events = req.body;
  if (!Array.isArray(events)) return res.sendStatus(400);

  for (const event of events) {
    const payer = event.account || "";
    const recipient = event?.account || "";

    if (
      event.amount >= 25000000 && // 0.025 SOL
      recipient === "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF"
    ) {
      console.log(`✅ Verified payment from ${payer}`);
      walletUsage[payer] = { hasPaid: true, count: 0 };
    }
  }

  res.sendStatus(200);
});

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
