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

// 🧠 CrimznBot handler
app.post("/api/crimznbot", async (req, res) => {
  const { prompt, wallet } = req.body;
  if (!walletUsage[wallet]) walletUsage[wallet] = { count: 0, hasPaid: false };

  if (!walletUsage[wallet].hasPaid && walletUsage[wallet].count >= 3) {
    return res.json({ response: "🟡 You've hit your 3-question limit. Please pay to continue." });
  }

  walletUsage[wallet].count++;

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await aiRes.json();
    const output = data.choices?.[0]?.message?.content || "⚠️ No response.";
    res.json({ response: output });
  } catch (err) {
    console.error("❌ CrimznBot error:", err.message);
    res.status(500).json({ response: "⚠️ AI error." });
  }
});

// ✅ Check payment status (placeholder memory logic)
app.get("/api/check-payment", async (req, res) => {
  const wallet = req.query.wallet;
  const paid = walletUsage[wallet]?.hasPaid || false;
  res.json({ hasPaid: paid });
});

// ✅ Solana Pay Link Generator with dynamic reference
app.get("/api/solana-pay-link", async (req, res) => {
  try {
    const wallet = req.query.wallet;
    if (!wallet) return res.status(400).json({ error: "Wallet is required." });

    const recipient = new PublicKey("Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF");
    const amount = new BigNumber(0.025);

    // 🔁 Generate unique reference from wallet
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

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
