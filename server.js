// 🚀 Required Modules
const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const { encodeURL } = require("@solana/pay");
const { PublicKey } = require("@solana/web3.js");
const bs58 = require("bs58");
const crypto = require("crypto");

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

// 🤖 CrimznBot Handler — 🔥 UPDATED FOR DYNAMIC TOKEN PRICE LOOKUP
app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;

// ✅ Crimzn bypass logic
const CRIMZN_WALLET = process.env.SOLANA_ADDRESS;

if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

if (wallet === CRIMZN_WALLET) {
  walletUsage[wallet].hasPaid = true;
  walletUsage[wallet].count = 0;
}

if (!walletUsage[wallet].hasPaid && walletUsage[wallet].count >= 3) {
  return res.json({ response: "🧱 You've hit your 3-question limit. Please pay to continue." });
}

  walletUsage[wallet].count++;

  let priceSummary = "🔸 Live Prices unavailable.";
  let dynamicPriceLine = "";

  try {
    const coingeckoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
    const priceData = await coingeckoRes.json();

    const btc = priceData?.bitcoin?.usd;
    const eth = priceData?.ethereum?.usd;
    const sol = priceData?.solana?.usd;

    if (btc && eth && sol) {
      priceSummary = `🔸 Live Prices: Bitcoin $${btc}, Ethereum $${eth}, Solana $${sol}`;
    }

    // 🆕 EXPANDED TOKEN ALIASES (100+)
    const tokenAliases = {
      btc: "bitcoin", eth: "ethereum", sol: "solana", ondo: "ondo-finance",
      pepe: "pepe", avax: "avalanche-2", link: "chainlink", pyth: "pyth-network",
      jup: "jupiter-exchange", dot: "polkadot", arb: "arbitrum", matic: "matic-network",
      op: "optimism", sui: "sui", apt: "aptos", bnb: "binancecoin", doge: "dogecoin",
      shib: "shiba-inu", near: "near", xrp: "ripple", xlm: "stellar", ada: "cardano",
      trx: "tron", ton: "toncoin", stx: "stacks", inj: "injective-protocol",
      fet: "fetch-ai", render: "render-token", rndr: "render-token", kas: "kaspa",
      mina: "mina-protocol", agix: "singularitynet", ldo: "lido-dao", dydx: "dydx",
      ens: "ethereum-name-service", blur: "blur", sei: "sei-network", joe: "joe",
      ltc: "litecoin", etc: "ethereum-classic", fil: "filecoin", aave: "aave",
      comp: "compound-governance-token", uni: "uniswap", crv: "curve-dao-token",
      sushi: "sushi", bal: "balancer", gmx: "gmx", woo: "woo-network", srm: "serum",
      ray: "raydium", aura: "aura-finance", perp: "perpetual-protocol",
      cvx: "convex-finance", dym: "dymension", galxe: "project-galaxy",
      mask: "mask-network", zk: "zkspace", magic: "magic", pendle: "pendle",
      velo: "velodrome-finance", gear: "gearbox", glmr: "moonbeam", one: "harmony",
      ksm: "kusama", ftm: "fantom", egld: "elrond-erd-2", rose: "rose",
      ocean: "ocean-protocol", celr: "celer-network", route: "router-protocol",
      hegic: "hegic", num: "numbers-protocol", aleph: "aleph-im", mdx: "mdex",
      borg: "cyborg", dogai: "dogai"
    };

    const lowerPrompt = prompt.toLowerCase();
    const matchKey = Object.keys(tokenAliases).find(key => lowerPrompt.includes(key));

    if (matchKey) {
      const tokenId = tokenAliases[matchKey];
      const tokenRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`);
      const tokenData = await tokenRes.json();
      const price = tokenData?.[tokenId]?.usd;
      if (price) {
        dynamicPriceLine = `🟢 Price for ${matchKey.toUpperCase()}: $${price}`;
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
            content: "You are CrimznBot — a fearless crypto strategist combining the minds of Raoul Pal, Michael Saylor, and Cathie Wood. You always provide alpha, live prices, and market-aware guidance."
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
    let output = aiData.choices?.[0]?.message?.content || "⚠️ No response.";
    output = output
      .replace(/As an AI language model,? ?/gi, "")
      .replace(/I (cannot|can't|do not|don’t) (predict|provide|guarantee)[^.]*\./gi, "")
      .replace(/I'm just a language model[^.]*\./gi, "")
      .replace(/As an artificial intelligence[^.]*\./gi, "");

    res.json({ response: output });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ response: "⚠️ AI error." });
  }
});

// 📣 PulseIt – Sentiment Analyzer
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
            content: "You are PulseIt – a fast, opinionated crypto sentiment engine. Output: Bullish 🟢, Bearish 🔴 or Neutral 🟡 with 1-line justification."
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

// 💸 Solana Pay Link Generator
app.get("/api/solana-pay-link", async (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ error: "Wallet is required." });

  const recipient = new PublicKey("Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF");
  const amount = 0.025;

  const hash = crypto.createHash("sha256").update(wallet + Date.now()).digest();
  const reference = new PublicKey(bs58.encode(hash.slice(0, 32)));

  const label = "CryptoConsult";
  const message = "Unlock CrimznBot";

  try {
    const url = encodeURL({ recipient, amount, reference, label, message });
    res.json({ url: url.toString() });
  } catch (err) {
    console.error("❌ Solana Pay link error:", err.message);
    res.status(500).json({ error: "Solana Pay generation failed." });
  }
});

// 🔁 Webhook – Payment Confirmation
app.post("/api/webhook", async (req, res) => {
  const events = req.body;
  if (!Array.isArray(events)) return res.sendStatus(400);

  for (const event of events) {
    const payer = event.account || "";
    const recipient = event?.account || "";

    if (
      event.amount >= 25000000 && // 0.025 SOL in lamports
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
