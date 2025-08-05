// ✅ Load Solana Web3 globally
const solanaWeb3 = window.solanaWeb3;

// 🚀 Crimzn Consult - Full Logic (Wallet, Firebase, Helius, Bot, PulseIt)
document.addEventListener("DOMContentLoaded", async () => {
  // 🎯 DOM Elements
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const askBtn = document.getElementById("askCrimznBtn");
  const responseBox = document.getElementById("response-box");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const solanaPayBtn = document.getElementById("solana-pay-btn");
  const pulseBtn = document.getElementById("pulseBtn");
  const pulseInput = document.getElementById("pulseInput");
  const pulseResult = document.getElementById("pulseResult");
  const walletStatus = document.getElementById("walletStatus");

  let connectedWallet = null;
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let hasPaid = localStorage.getItem("hasPaid") === "true";

  // 📈 Live Prices (BTC, ETH, SOL)
  try {
    const res = await fetch("/livePrices");
    const data = await res.json();
    document.getElementById("livePrices").innerHTML = `
      BTC: $${data.bitcoin.usd}<br>
      ETH: $${data.ethereum.usd}<br>
      SOL: $${data.solana.usd}
    `;
  } catch (e) {
    document.getElementById("livePrices").innerText = "⚠️ Error loading prices.";
  }

  // 🔌 Connect Wallet
  connectBtn.onclick = async () => {
    try {
      const resp = await window.solana.connect();
      connectedWallet = resp.publicKey.toString();
      walletStatus.innerText = `✅ Connected: \${connectedWallet.slice(0, 4)}...\${connectedWallet.slice(-4)}`;
      connectBtn.classList.add("hidden");
      disconnectBtn.classList.remove("hidden");
    } catch (e) {
      alert("❌ Wallet connection failed.");
    }
  };

  // ❌ Disconnect Wallet
  disconnectBtn.onclick = () => {
    connectedWallet = null;
    walletStatus.innerText = "⚠️ Not connected";
    connectBtn.classList.remove("hidden");
    disconnectBtn.classList.add("hidden");
  };

  // 📝 Firebase - Save Profile
  saveProfileBtn.onclick = async () => {
    const profile = {
      name: nameInput.value || "Anonymous",
      email: emailInput.value || "not provided",
      wallet: connectedWallet || "not connected",
    };

    try {
      await fetch("/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      alert("✅ Profile saved.");
    } catch {
      alert("❌ Failed to save profile.");
    }
  };

  // 🤖 CrimznBot - Ask Question
  askBtn.onclick = async () => {
    const prompt = document.getElementById("user-input").value.trim();
    if (!prompt) return;

    if (!hasPaid && questionCount >= 3) {
      document.querySelector(".paywall").classList.remove("hidden");
      responseBox.innerText = "🔒 You've reached your limit. Please unlock.";
      return;
    }

    responseBox.innerText = "🧠 CrimznBot thinking...";
    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      responseBox.innerText = "🟢 " + data.response;

      questionCount++;
      localStorage.setItem("questionCount", questionCount);
      if (questionCount > 3 && !hasPaid) {
        solanaPayBtn.classList.remove("hidden");
      }
    } catch {
      responseBox.innerText = "❌ Error getting response.";
    }
  };

  // 💸 Solana Pay + Helius - Unlock Access
  solanaPayBtn.onclick = async () => {
    if (!connectedWallet) return alert("Connect wallet first!");

    try {
      const res = await fetch("/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: connectedWallet }),
      });
      const data = await res.json();
      if (data.hasPaid) {
        localStorage.setItem("hasPaid", "true");
        solanaPayBtn.classList.add("hidden");
        responseBox.innerText = "✅ Access Unlocked!";
      } else {
        alert("❌ Payment not detected yet.");
      }
    } catch {
      alert("❌ Error verifying payment.");
    }
  };

  // 📊 PulseIt - Sentiment Analyzer
  pulseBtn.onclick = async () => {
    const input = pulseInput.value.trim();
    if (!input) return;
    pulseResult.innerText = "🧠 Analyzing...";
    try {
      const res = await fetch("/pulse-it", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const json = await res.json();
      pulseResult.innerText = `📊 Sentiment: \${json.result}`;
    } catch {
      pulseResult.innerText = "⚠️ Error analyzing sentiment.";
    }
  };

  // 🔁 Reset input after ask
  document.getElementById("user-input").value = "";
  responseBox.scrollIntoView({ behavior: "smooth" });
});
