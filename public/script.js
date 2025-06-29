let questionCount = 0;
const maxQuestions = 3;

document.getElementById("ask-btn").onclick = async () => {
  const input = document.getElementById("user-input");
  const chat = document.getElementById("bot-output");
  const question = input.value.trim();
  if (!question) return;

  // Clear previous answer
  chat.innerHTML = `<div style="color: #f7931a"><strong>You:</strong> ${question}</div>`;

  if (questionCount >= maxQuestions) {
    chat.innerHTML += `
      <div style="color: limegreen;"><strong>CrimznBot:</strong> Access limit reached. To <strong>continue</strong>, please send 0.025 SOL:</div>
      <a href="solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=0.025&label=CrimznConsult" target="_blank">
        <img src="/solana-logo.svg" alt="Solana Pay" style="width:80px;" />
      </a>
    `;

    // 🔒 Disable input after hitting paywall
    document.getElementById("user-input").disabled = true;
    document.getElementById("ask-btn").disabled = true;

    return;
  }

  questionCount++;

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    const data = await res.json();

    chat.innerHTML += `
      <div style="color: limegreen;"><strong>CrimznBot:</strong> ${data.response}</div>
      <div style="color: orange;"><strong>📊 PulseIt Sentiment:</strong> ${data.pulse}</div>
    `;
    input.value = "";
  } catch (err) {
    chat.innerHTML += `<div style="color: red;">⚠️ CrimznBot is offline or encountered an error.</div>`;
  }
};

// PulseIt Analyzer
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
