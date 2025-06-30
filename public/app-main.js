// 💬 CrimznBot Handler with 3-question paywall
let questionCount = 0;
const maxQuestions = 3;
let solanaUnlocked = false;

document.getElementById("ask-btn").onclick = async () => {
  const input = document.getElementById("user-input");
  const chat = document.getElementById("bot-output");
  const question = input.value.trim();
  if (!question) return;

  chat.innerHTML = `<div style="color: #f7931a"><strong>You:</strong> ${question}</div>`;

  if (questionCount >= maxQuestions && !solanaUnlocked) {
    chat.innerHTML += `
      <div style="color: limegreen;"><strong>CrimznBot:</strong> Access limit reached. Unlock to continue.</div>
      <a href="solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF">
        <img src="/solana-logo.svg" alt="Solana Pay" style="width: 120px; margin: 10px auto;" />
      </a>
    `;
    document.getElementById("user-input").disabled = true;
    document.getElementById("ask-btn").disabled = true;
    return;
  }

  questionCount++;

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    chat.innerHTML += `<div style="color: limegreen;"><strong>CrimznBot:</strong> ${data.response}</div>`;
    input.value = "";
  } catch (err) {
    chat.innerHTML += `<div style="color:red;"><strong>Error:</strong> Failed to get response.</div>`;
    console.error(err);
  }
};

// 🔓 Solana unlock checker using backend Helius check
async function checkSolanaUnlock() {
  try {
    const res = await fetch("/api/check-solana-payment");
    const data = await res.json();
    if (data.unlocked) {
      solanaUnlocked = true;
      document.getElementById("paywall").style.display = "none";
      document.getElementById("user-input").disabled = false;
      document.getElementById("ask-btn").disabled = false;
      document.getElementById("bot-output").innerHTML += `
        ✅ <strong>Access Unlocked!</strong> You can now continue asking questions.
      `;
    }
  } catch (err) {
    console.error("Solana unlock check error:", err);
  }
}
setInterval(checkSolanaUnlock, 10000);

// 📊 PulseIt Analyzer
document.getElementById("analyze-btn").onclick = () => {
  const input = document.getElementById("pulse-input").value.toLowerCase();
  const output = document.getElementById("pulseOutput");

  let sentiment = "Neutral 🟡";
  let explanation = "No strong bias detected.";

  if (input.includes("etf") || input.includes("adoption") || input.includes("bullish") || input.includes("crypto")) {
    sentiment = "Bullish 🟢";
    explanation = "Positive developments or optimism detected.";
  } else if (input.includes("war") || input.includes("regulation") || input.includes("dump") || input.includes("scam")) {
    sentiment = "Bearish 🔴";
    explanation = "Concerns or negative developments noted.";
  }

  output.innerHTML = `<strong>PulseIt:</strong> ${sentiment}<br><em>${explanation}</em>`;
  document.getElementById("pulse-input").value = "";
};

// 💸 Live Prices (CoinGecko)
async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("price-btc").innerText = `BTC: $${data.bitcoin.usd}`;
    document.getElementById("price-eth").innerText = `ETH: $${data.ethereum.usd}`;
    document.getElementById("price-sol").innerText = `SOL: $${data.solana.usd}`;
  } catch (err) {
    console.error("Price fetch failed:", err);
  }
}
fetchPrices();
setInterval(fetchPrices, 30000);

// 🦙 Phantom Wallet Connect/Disconnect
let walletConnected = false;
let publicKey = "";

async function connectWallet() {
  try {
    const provider = window.solana;
    if (!provider || !provider.isPhantom) {
      alert("Phantom Wallet not found");
      return;
    }

    if (!walletConnected) {
      const resp = await provider.connect();
      publicKey = resp.publicKey.toString();
      document.getElementById("wallet-display").innerText = `🔐 ${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
      document.getElementById("wallet-button").innerText = "Disconnect Wallet";
      walletConnected = true;
    } else {
      await provider.disconnect();
      document.getElementById("wallet-display").innerText = "";
      document.getElementById("wallet-button").innerText = "Connect Wallet";
      walletConnected = false;
    }
  } catch (err) {
    console.error("Wallet error:", err);
  }
}
document.getElementById("wallet-button").onclick = connectWallet;

// 🔓 Solana unlock check on page load
async function checkUnlock() {
  try {
    const res = await fetch("/api/check-solana-payment");
    const data = await res.json();
    if (data.unlocked) {
      console.log("🔓 Solana payment detected. Unlocking CrimznBot.");
      document.getElementById("paywall").style.display = "none";
    } else {
      console.log("🔒 No payment detected. Paywall remains.");
    }
  } catch (err) {
    console.error("❌ Unlock check failed:", err.message);
  }
}
window.addEventListener("DOMContentLoaded", checkUnlock);
