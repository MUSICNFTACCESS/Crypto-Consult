let questionCount = 0;
let paywallShown = false;
let connectedWallet = null;

// 🌐 Check for payment using Helius API
async function checkPayment() {
  const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
  const HELIUS_TX_URL = process.env.HELIUS_TX_URL;

  try {
    const res = await fetch(`${HELIUS_TX_URL}?api-key=${HELIUS_API_KEY}`);
    const data = await res.json();

    const hasPaid = data?.transactions?.some(tx => {
      return tx.account === "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF" && tx.amount >= 0.025;
    });

    if (hasPaid) {
      document.getElementById("paywall").style.display = "none";
      paywallShown = false;
    }
  } catch (err) {
    console.error("Payment check failed:", err);
  }
}

// 🔗 Wallet Connect
async function connectWallet() {
  try {
    const provider = window.solana;
    if (!provider?.isPhantom) {
      alert("Phantom Wallet not found.");
      return;
    }

    const resp = await provider.connect();
    connectedWallet = resp.publicKey.toString();
    document.getElementById("wallet-address").textContent =
      connectedWallet.slice(0, 4) + "..." + connectedWallet.slice(-4);
    document.getElementById("disconnect-wallet").style.display = "inline-block";

    await checkPayment();
  } catch (err) {
    console.error("Wallet connection failed:", err);
  }
}

function disconnectWallet() {
  connectedWallet = null;
  document.getElementById("wallet-address").textContent = "";
  document.getElementById("disconnect-wallet").style.display = "none";
}

// 🤖 CrimznBot Logic
document.getElementById("ask-btn").addEventListener("click", async () => {
  const input = document.getElementById("user-input").value.trim();
  const output = document.getElementById("bot-output");
  output.innerHTML = "";

  if (!input) return;

  questionCount++;

  if (questionCount > 3 && paywallShown) {
    document.getElementById("paywall").style.display = "block";
    return;
  }

  try {
    const res = await fetch("https://crypto-consult.onrender.com/api/crimznbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    const reply = document.createElement("p");
    reply.style.color = "limegreen";
    reply.textContent = `🤖 ${data.reply || "CrimznBot is recharging. Try again."}`;
    output.appendChild(reply);
  } catch (err) {
    output.textContent = "❌ Error contacting CrimznBot.";
  }
});

// 📊 PulseIt Sentiment Analyzer
document.getElementById("analyze-btn").addEventListener("click", () => {
  const keyword = document.getElementById("pulse-input").value.toLowerCase().trim();
  const output = document.getElementById("pulse-output");
  output.innerHTML = "";

  let sentiment = "neutral";
  let icon = "🟡";
  let comment = "Market sentiment appears neutral.";

  if (/war|inflation|dump|lawsuit|hack|rug/.test(keyword)) {
    sentiment = "bearish";
    icon = "🔴";
    comment = "Bearish outlook based on current conditions.";
  } else if (/etf|bull|pump|trump|spot|halving|institutional|fund|mint/.test(keyword)) {
    sentiment = "bullish";
    icon = "🟢";
    comment = "Bullish indicators detected for this topic.";
  }

  const result = document.createElement("p");
  result.textContent = `${icon} ${sentiment.toUpperCase()}: ${comment}`;
  result.style.color = sentiment === "bullish" ? "limegreen" : sentiment === "bearish" ? "red" : "gold";
  output.appendChild(result);
});

// 🔄 Event listeners for wallet
document.getElementById("connect-wallet").addEventListener("click", connectWallet);
document.getElementById("disconnect-wallet").addEventListener("click", disconnectWallet);

// 🕒 Auto check for paywall on load if wallet connected
window.addEventListener("load", () => {
  if (window.solana?.isConnected) {
    connectWallet();
  }
});
