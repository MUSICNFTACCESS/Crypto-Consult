let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
let paywallShown = false;
let connectedWallet = null;

// 🔐 Check for payment using Helius API
async function checkPayment() {
  const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
  const HELIUS_TX_URL = process.env.HELIUS_TX_URL;

  try {
    const res = await fetch(`${HELIUS_TX_URL}?api-key=${HELIUS_API_KEY}`);
    const data = await res.json();

    const hasPaid = data?.transactions?.some(tx =>
      tx.account === "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF" &&
      tx.amount >= 0.025
    );

    if (hasPaid) {
      document.getElementById("paywall").style.display = "none";
      paywallShown = false;
    }
  } catch (err) {
    console.error("Payment check failed:", err);
  }
}

// 🔌 Wallet Connect
async function connectWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    alert("Phantom Wallet not found.");
    return;
  }

  try {
    const resp = await window.solana.connect();
    connectedWallet = resp.publicKey.toString();

    document.getElementById("connectWalletBtn").textContent = connectedWallet.slice(0, 4) + "..." + connectedWallet.slice(-4);
    document.getElementById("connectWalletBtn").style.display = "none";
    document.getElementById("disconnect-wallet").style.display = "inline-block";

    checkPayment(); // 🔁 Check for payment on wallet connect
  } catch (err) {
    console.error("Wallet connection failed:", err);
  }
}

function disconnectWallet() {
  connectedWallet = null;
  document.getElementById("connectWalletBtn").textContent = "Connect Wallet";
  document.getElementById("connectWalletBtn").style.display = "inline-block";
  document.getElementById("disconnect-wallet").style.display = "none";
}

// 🤖 CrimznBot Logic
document.getElementById("ask-btn").addEventListener("click", async () => {
  const input = document.getElementById("user-input").value.trim();
  const output = document.getElementById("bot-output");
  output.innerHTML = "";

  if (!input) return;

  questionCount++;
  localStorage.setItem("questionCount", questionCount);

  if (questionCount > 3 && !paywallShown) {
    document.getElementById("paywall").style.display = "block";
    paywallShown = true;
    return;
  }

  try {
    const res = await fetch("https://crypto-consult.onrender.com/api/crimznbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    const reply = data.reply || "CrimznBot is recharging. Try again.";

    output.innerHTML = `<span style="color: limegreen;">${reply}</span>`;
  } catch (err) {
    console.error("Bot error:", err);
    output.textContent = "❌ Error contacting CrimznBot.";
  }
});

// 📊 PulseIt Sentiment Analyzer
document.getElementById("analyze-btn").addEventListener("click", () => {
  const keyword = document.getElementById("pulse-input").value.toLowerCase().trim();
  const pulseOutput = document.getElementById("pulse-output");
  if (!keyword) return;

  let sentiment = "neutral";
  let comment = "🔶 Market sentiment appears neutral.";

  if (/war|rate hike|inflation|lawsuit|hacked|rug/i.test(keyword)) {
    sentiment = "bearish";
    comment = "🔴 BEARISH: Bearish outlook based on current conditions.";
  } else if (/etf|bullish|pump|spot|regulation|institutional|fund|mint/i.test(keyword)) {
    sentiment = "bullish";
    comment = "🟢 BULLISH: Bullish sentiment detected for this topic.";
  }

  pulseOutput.innerHTML = `<span style="color: ${sentiment === "bullish" ? "limegreen" : sentiment === "bearish" ? "red" : "gold"};">
    ${comment}</span>`;
});

// ⚙️ Event listeners for Wallet
document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
document.getElementById("disconnect-wallet").addEventListener("click", disconnectWallet);

// ✅ Auto check for paywall on load + wallet
window.addEventListener("load", () => {
  if (window.solana?.isConnected) {
    connectWallet();
  }
  checkPayment(); // 🧠 Check payment status even on page visit
});
