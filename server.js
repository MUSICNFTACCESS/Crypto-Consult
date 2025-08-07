// 🔥 Crimzn Consult Backend - Final Merge: gpt-4o + Firebase + CrimznBot + PulseIt
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const nacl = require("tweetnacl");
const bs58 = require("bs58");
const sentiment = require("sentiment");
const { PublicKey } = require("@solana/web3.js");

// 🔍 ENV Debug
console.log("🧪 Starting ENV Debug Mode...");
console.log("🔐 FIREBASE_SERVICE_ACCOUNT_KEY_BASE64:", process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ? "FOUND" : "❌ MISSING");
console.log("🔑 HELIUS_API_KEY:", process.env.HELIUS_API_KEY ? "FOUND" : "❌ MISSING");
console.log("💼 SOLANA_ADDRESS:", process.env.SOLANA_ADDRESS ? "FOUND" : "❌ MISSING");
console.log("🧠 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "FOUND" : "❌ MISSING");

// 🔐 Firebase Admin Setup (base64-encoded key in Render)
const admin = require("firebase-admin");

let serviceAccount;
try {
  const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString("utf-8");
  serviceAccount = JSON.parse(decodedKey);
} catch (e) {
  console.error("❌ Error parsing Firebase key:", e.message);
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized");
  } catch (e) {
    console.error("❌ Firebase Admin init failed:", e.message);
  }
}

const db = admin.firestore();

// ⚙️ App Init
const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
const PORT = process.env.PORT || 3000;

// 🧱 Middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://s3.tradingview.com",
        "https://www.tradingview.com",
        "https://commerce.coinbase.com",
        "https://www.paypal.com",
        "https://www.paypalobjects.com"
      ],
      "frame-src": [
        "https://s.tradingview.com",
        "https://www.tradingview.com",
        "https://commerce.coinbase.com",
        "https://www.paypal.com"
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      "font-src": [
        "https://fonts.gstatic.com"
      ]
    }
  })
);

// 🔓 Usage Tracking
const walletUsage = {};

// 🔓 Helius Unlock Logic
async function verifyHeliusPayment(wallet) {
  try {
    const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${process.env.HELIUS_API_KEY}&limit=5`;
    const response = await fetch(url);
    const data = await response.json();
    const match = data.find(tx =>
      tx.type === "TRANSFER" &&
      tx.nativeTransfers?.some(t => t.toUserAccount === process.env.SOLANA_ADDRESS && t.amount >= 25000000)
    );
    return !!match;
  } catch (e) {
    console.error("🔴 Failed to verify payment:", e.message);
    return false;
  }
}

// 🧠 CrimznBot: Token Lookup + GPT-4o Crypto Chat (3 Free Questions)
app.post("/ask", async (req, res) => {
  const { prompt, wallet } = req.body;
  if (!prompt || !wallet) return res.send("❌ Missing prompt or wallet.");

  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

  if (walletUsage[wallet].count >= 3 && !walletUsage[wallet].hasPaid) {
    const paid = await verifyHeliusPayment(wallet);
    if (!paid) return res.send("🔒 3 free questions used. Unlock CrimznBot with 0.025 SOL.");
    walletUsage[wallet].hasPaid = true;
  }

  walletUsage[wallet].count++;

  try {
    const tokenAliases = {
      btc: "bitcoin", bitcoin: "bitcoin",
      eth: "ethereum", ethereum: "ethereum",
      sol: "solana", solana: "solana",
      link: "chainlink", dot: "polkadot", ada: "cardano",
      avax: "avalanche-2", matic: "polygon", doge: "dogecoin",
      shib: "shiba-inu", pepe: "pepe", bonk: "bonk",
      sui: "sui", apt: "aptos", arb: "arbitrum",
      op: "optimism", jup: "jupiter-exchange",
      pyth: "pyth-network", rndr: "render-token",
      stx: "stacks", ton: "toncoin", xrp: "ripple",
      usdc: "usd-coin", usdt: "tether", wif: "dogwifcoin"
    };

    const lowerPrompt = prompt.toLowerCase();
    const token = Object.keys(tokenAliases).find(k => lowerPrompt.includes(k));
    if (token) {
      const id = tokenAliases[token];
      const resp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
      const data = await resp.json();
      if (data[id]) {
        return res.send(`💰 ${id.toUpperCase()} price: $${data[id].usd}`);
      }
    }

    const reply = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are CrimznBot, a strategic, no-fluff crypto consultant. You give clear, insightful answers like a market-savvy degen who’s also a professional. Keep it sharp, accurate, and helpful — avoid filler, stay laser-focused on crypto, trading, and strategy."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const aiData = await reply.json();
    const answer = aiData.choices?.[0]?.message?.content || "🤖 CrimznBot didn’t have a clean read on that.";

    const escapeHTML = (str) =>
      str.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");

    res.send(escapeHTML(answer));
  } catch (err) {
    console.error("🛑 CrimznBot error:", err.message);
    res.send("❌ Something went wrong. Try again in a bit.");
  }
});

// 👤 Save Profile to Firebase
app.post("/save-profile", async (req, res) => {
  const { wallet, name, email } = req.body;
  if (!wallet) return res.status(400).send("❌ Wallet is required.");

  try {
    await db.collection("profiles").doc(wallet).set({
      wallet,
      name: name || "",
      email: email || "",
      timestamp: new Date().toISOString(),
    });
    res.send("✅ Profile saved.");
  } catch (e) {
    console.error("❌ Firebase error:", e.message);
    res.status(500).send("❌ Failed to save profile.");
  }
});

// 📊 PulseIt: GPT-4o Sentiment Analyzer with Emojis + Reasoning
app.post("/pulseit", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send("❌ Missing text");

  try {
    const vibeMap = {
      "very positive": "🚀 Extremely Bullish",
      "positive": "📈 Bullish",
      "neutral": "🤔 Neutral",
      "negative": "📉 Bearish",
      "very negative": "💀 Extremely Bearish",
    };

    const pulsePrompt = `You are PulseIt, a crypto market sentiment analyst. Based on the score and message, respond in 1 sentence explaining the sentiment.`;

    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: pulsePrompt },
          { role: "user", content: `Message: "${text}"` },
        ],
      }),
    });

    const json = await gptResponse.json();
    const explanation = json.choices?.[0]?.message?.content?.trim() || "🤖 No explanation.";
    const score = explanation.includes("bull") || explanation.includes("🚀") ? 2
                : explanation.includes("bear") || explanation.includes("💀") ? -2
                : 0;
    const vibe = score > 1 ? vibeMap["very positive"]
               : score > 0 ? vibeMap["positive"]
               : score < -1 ? vibeMap["very negative"]
               : score < 0 ? vibeMap["negative"]
               : vibeMap["neutral"];

    res.send(`🧠 PulseIt Score: ${score} → ${vibe}\n💬 ${explanation}`);
  } catch (e) {
    console.error("⚠️ PulseIt error:", e.message);
    res.status(500).send("❌ PulseIt failed.");
  }
});

// ✅ Live Prices Route
app.get("/livePrices", async (req, res) => {
  try {
    const result = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await result.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching prices:", err);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// 🔄 Wildcard route to serve frontend for unmatched paths
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Start Server — must be last!
app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
  console.log("🧠 CrimznBot + PulseIt + SaveProfile + Firebase booted ✅");
  console.log("⚡ Built by Crimzn, powered by Solana + Helius");
});
// 🧠 PulseIt Sentiment Analysis API
app.post("/pulse-it", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.send("❌ Missing text.");

  try {
    const analysis = new sentiment();
    const result = analysis.analyze(text);

    const score = result.score;
    let emoji = "🤔 Neutral";
    if (score > 0) emoji = "🚀 Positive";
    else if (score < 0) emoji = "🔻 Negative";

    console.log(`🧠 PulseIt Score: ${score} → ${emoji}`);
    res.send(`🧠 PulseIt Score: ${score} → ${emoji}\\n💬 ${result.comparative >= 0.5 ? "The sentiment is highly positive" : "The sentiment is neutral or mixed"}, as indicated by: "${text}"`);
  } catch (e) {
    console.error("❌ PulseIt Error:", e.message);
    res.status(500).send("❌ PulseIt analysis failed.");
  }
});
