// 🧠 CrimznBot Handler with 3-question paywall
let questionCount = 0;
const maxQuestions = 3;
let solanaUnlocked = false;
let unlockMessageShown = false; // ✅ Prevents repeat unlock messages

document.getElementById("ask-btn").onclick = async () => {
  const input = document.getElementById("user-input");
  const chat = document.getElementById("bot-output");
  const question = input.value.trim();

  if (!question) return;

  chat.innerHTML = ""; // 🧼 Clear all previous messages
  chat.innerHTML += `<div style="color:#f7931a"><strong>You:</strong> ${question}</div>`;

  if (questionCount >= maxQuestions && !solanaUnlocked) {
    chat.innerHTML += `
      <div style="color:red"><strong>CrimznBot:</strong> Access limit reached. Unlock to continue.</div>
      <a href="https://solana.com/pay" target="_blank" rel="noopener">
        <img src="/solana-logo.svg" alt="Solana Pay" style="width: 120px; margin: 10px auto;" />
      </a>
    `;
    document.getElementById("user-input").disabled = true;
    document.getElementById("ask-btn").disabled = true;
    return;
  }

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    chat.innerHTML += `<div style="color:limegreen;"><strong>CrimznBot:</strong> ${data.response}</div>`;
    input.value = "";
    questionCount++;
  } catch (err) {
    chat.innerHTML += `<div style="color:red;"><strong>Error:</strong> Failed to get response.</div>`;
    console.error("Bot fetch failed:", err);
  }
};

// 🔓 Solana unlock checker using backend Helius check
async function checkSolanaUnlock() {
  try {
    const res = await fetch("/api/check-solana-payment");
    const data = await res.json();

    if (data.unlocked && !unlockMessageShown) {
      solanaUnlocked = true;
      unlockMessageShown = true; // ✅ Set true to block repeats
      document.getElementById("user-input").disabled = false;
      document.getElementById("ask-btn").disabled = false;
      document.getElementById("bot-output").innerHTML +=
        `<div style="color:limegreen;"><strong>✅ Access unlocked</strong>. You can now continue asking questions.</div>`;
    }
  } catch (err) {
    console.error("Solana unlock check error:", err);
  }
}
setInterval(checkSolanaUnlock, 10000); // 🔁 Re-check every 10s

// 🧠 PulseIt Analyzer
document.getElementById("analyze-btn").onclick = () => {
  const input = document.getElementById("pulse-input").value.toLowerCase();
  const output = document.getElementById("pulse-output");

  let sentiment = "neutral";
  let explanation = "No strong bias detected.";

  if (
    input.includes("etf") ||
    input.includes("adoption") ||
    input.includes("bullish") ||
    input.includes("crypto")
  ) {
    sentiment = "bullish";
    explanation = "Positive sentiment or optics detected.";
  } else if (
    input.includes("regulation") ||
    input.includes("dump") ||
    input.includes("scam")
  ) {
    sentiment = "bearish";
    explanation = "Negative or adverse developments noted.";
  }

  output.innerHTML = `<strong>PulseIt:</strong> <span style="color:${
    sentiment === "bullish" ? "lime" : sentiment === "bearish" ? "red" : "orange"
  }">${sentiment.toUpperCase()}</span><br><em>${explanation}</em>`;

  document.getElementById("pulse-input").value = "";
};

// 📈 Live Prices (CoinGecko)
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
    console.error("Wallet connect/disconnect error:", err);
  }
}
document.getElementById("wallet-button").addEventListener("click", connectWallet);
