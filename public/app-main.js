// 🔥 Crimzn Consult - Full Logic (Wallet, Bot, PulseIt, Paywall)
document.addEventListener("DOMContentLoaded", async () => {
  // 🎯 DOM Elements
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const askBtn = document.getElementById("askCrimznBtn");
  const solanaPayBtn = document.getElementById("solana-pay-btn");
  const responseBox = document.getElementById("response-box");
  const paywall = document.getElementById("paywall");
  const nameInput = document.getElementById("userNameInput");
  const emailInput = document.getElementById("userEmailInput");
  const userPrompt = document.getElementById("userPrompt");
  const walletStatus = document.getElementById("wallet-status");
  const pulseInput = document.getElementById("pulseInput");
  const pulseBtn = document.getElementById("pulseBtn");
  const pulseResult = document.getElementById("pulseResult");

  let connectedWallet = null;
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let hasPaid = localStorage.getItem("hasPaid") === "true";

  // 💸 Load Prices
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("btc-price").innerText = "$" + data.bitcoin.usd;
    document.getElementById("eth-price").innerText = "$" + data.ethereum.usd;
    document.getElementById("sol-price").innerText = "$" + data.solana.usd;
  } catch (e) {
    console.error("Price fetch error", e);
  }

  // 🔌 Connect Wallet
  connectBtn.onclick = async () => {
    try {
      const resp = await window.solana.connect();
      connectedWallet = resp.publicKey.toString();
      walletStatus.innerText = "🔓 " + connectedWallet;
      connectBtn.classList.add("hidden");
      disconnectBtn.classList.remove("hidden");
    } catch (err) {
      alert("Wallet connection failed.");
    }
  };

  // ❌ Disconnect Wallet
  disconnectBtn.onclick = () => {
    connectedWallet = null;
    walletStatus.innerText = "🔒 Not connected";
    connectBtn.classList.remove("hidden");
    disconnectBtn.classList.add("hidden");
  };

  // 💾 Save Profile
  saveProfileBtn.onclick = async () => {
    const profile = {
      name: nameInput.value || "Anonymous",
      email: emailInput.value || "",
      wallet: connectedWallet || "Not connected",
    };
    await fetch("/save-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    alert("✅ Profile saved.");
  };

  // 🤖 CrimznBot Ask
  askBtn.onclick = async () => {
    const prompt = userPrompt.value.trim();
    if (!prompt) return;
    if (!hasPaid && questionCount >= 3) {
      paywall.classList.remove("hidden");
      responseBox.innerText = "⚠️ You've reached your limit. Please unlock.";
      return;
    }

    responseBox.innerText = "⏳ CrimznBot thinking...";
    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      responseBox.innerText = "🧠 " + data.response;
      questionCount++;
      localStorage.setItem("questionCount", questionCount);
      if (questionCount >= 3 && !hasPaid) {
        paywall.classList.remove("hidden");
      }
    } catch {
      responseBox.innerText = "❌ Error getting response.";
    }
  };

  // 🔓 Solana Pay Unlock
  solanaPayBtn.onclick = async () => {
    if (!connectedWallet) return alert("Connect wallet first!");
    const res = await fetch("/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: connectedWallet }),
    });
    const data = await res.json();
    if (data.verified) {
      hasPaid = true;
      localStorage.setItem("hasPaid", "true");
      paywall.classList.add("hidden");
      responseBox.innerText = "✅ Access Unlocked!";
    } else {
      alert("❌ Payment not detected yet.");
    }
  };

  // 📊 PulseIt Sentiment Tool
  pulseBtn.onclick = async () => {
    const input = pulseInput.value.trim();
    if (!input) return;
    pulseResult.innerText = "🔍 Analyzing...";
    try {
      const res = await fetch("/pulseit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const json = await res.json();
      pulseResult.innerText = "📊 Sentiment: " + json.result;
    } catch {
      pulseResult.innerText = "⚠️ Error analyzing sentiment.";
    }
  };
});
