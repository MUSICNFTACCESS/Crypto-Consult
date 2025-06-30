let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
let paywallShown = false;
let connectedWallet = null;
let hasPaid = false;

// 🔐 Check for payment using Helius API
async function checkPayment() {
  const HELIUS_API_KEY = "REPLACE_WITH_STATIC_KEY";
  const HELIUS_TX_URL = "REPLACE_WITH_STATIC_URL";

  try {
    const res = await fetch(`${HELIUS_TX_URL}?api-key=${HELIUS_API_KEY}`);
    const data = await res.json();

    hasPaid = data?.transactions?.some(tx =>
      tx.account === "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF" &&
      tx.amount >= 0.025
    );

    if (hasPaid) {
      document.getElementById("paywall").style.display = "none";
      paywallShown = false;
    }
  } catch (err) {
    console.error("💸 Payment check failed:", err);
  }
}

// 🔌 Connect Phantom Wallet
async function connectWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    alert("Phantom Wallet not found.");
    return;
  }

  try {
    const resp = await window.solana.connect();
    connectedWallet = resp.publicKey.toString();

    const btn = document.getElementById("connectWalletBtn");
    btn.textContent = connectedWallet;
    btn.style.display = "none";

    const disconnectBtn = document.createElement("button");
    disconnectBtn.id = "disconnect-wallet";
    disconnectBtn.className = "solana-button";
    disconnectBtn.textContent = "Disconnect Wallet";
    disconnectBtn.onclick = disconnectWallet;
    btn.after(disconnectBtn);

    await checkPayment();
  } catch (err) {
    console.error("🔌 Wallet connection failed:", err);
  }
}

function disconnectWallet() {
  connectedWallet = null;
  const btn = document.getElementById("connectWalletBtn");
  btn.textContent = "Connect Wallet";
  btn.style.display = "inline-block";

  const disconnectBtn = document.getElementById("disconnect-wallet");
  if (disconnectBtn) disconnectBtn.remove();
}

// 🤖 CrimznBot Logic
document.getElementById("ask-btn").addEventListener("click", async () => {
  const input = document.getElementById("user-input").value.trim();
  const output = document.getElementById("bot-output");
  output.innerHTML = "";

  if (!input) return;

  questionCount++;
  localStorage.setItem("questionCount", questionCount);

  if (questionCount > 3 && !hasPaid) {
    document.getElementById("paywall").style.display = "block";
    paywallShown = true;
    return;
  }

  try {
    const res = await fetch("https://crypto-consult.onrender.com/api/crimznbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input })
    });

    const data = await res.json();
    output.innerHTML = `<p style="color: #00ff00;"><strong>${data.reply}</strong></p>`;
  } catch (err) {
    output.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }
});

// 📊 PulseIt Logic
document.getElementById("analyze-btn").addEventListener("click", async () => {
  const topic = document.getElementById("pulse-input").value.trim();
  const output = document.getElementById("pulse-output");
  output.innerHTML = "";

  if (!topic) return;

  try {
    const res = await fetch("https://crypto-consult.onrender.com/api/pulseit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic })
    });

    const data = await res.json();
    const color = data.sentiment === "Bullish" ? "green" :
                  data.sentiment === "Bearish" ? "red" : "yellow";

    output.innerHTML = `<p style="color: ${color};"><strong>${data.sentiment}</strong>: ${data.message}</p>`;
  } catch (err) {
    output.innerHTML = `<p style="color: red;">Error: ${err.message}</p>`;
  }

  document.getElementById("pulse-input").value = "";
});

// 👻 Phantom Wallet button hookup
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("connectWalletBtn");
  if (btn) btn.addEventListener("click", connectWallet);
});
