let questionCount = 0;
const maxQuestions = 3;

document.getElementById("ask-btn").onclick = async () => {
  const input = document.getElementById("user-input");
  const chat = document.getElementById("bot-output");
  const question = input.value.trim();

  if (!question) return;

  // Clear previous CrimznBot response
  chat.innerHTML = `<div style="color: #f7931a"><strong>You:</strong> ${question}</div>`;

  if (questionCount >= maxQuestions) {
    chat.innerHTML += `<div style="color: limegreen;"><strong>CrimznBot:</strong> Access limit reached. To <strong>continue</strong>, please send 0.025 SOL:</div>
    <a href="solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=0.025&label=CrimznConsult" target="_blank">
      <img src="/solana-logo.svg" alt="Solana Pay" style="width:80px;" />
    </a>`;
    return;
  }

  questionCount++;

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question })
    });

    const data = await res.json();
    chat.innerHTML += `<div style="color: limegreen;"><strong>CrimznBot:</strong> ${data.response}</div>
      <div style="color: orange;"><strong>📊 PulseIt Sentiment:</strong> ${data.pulse}</div>`;
  } catch (err) {
    chat.innerHTML += `<div style="color: red;">⚠️ CrimznBot is offline or encountered an error.</div>`;
  }
};

document.getElementById("analyze-btn").onclick = () => {
  const input = document.getElementById("pulse-input").value.toLowerCase();
  const output = document.getElementById("pulseOutput");

  let sentiment = "Neutral 🟡";
  if (
    input.includes("war") ||
    input.includes("regulation") ||
    input.includes("hacked") ||
    input.includes("scam") ||
    input.includes("dump")
  ) {
    sentiment = "Bearish 🔴";
  } else if (
    input.includes("etf") ||
    input.includes("adoption") ||
    input.includes("bullish") ||
    input.includes("innovation")
  ) {
    sentiment = "Bullish 🟢";
  }

};

// Live Prices
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
setInterval(fetchPrices, 30000); // every 30s

// Wallet Connect
async function connectWallet() {
  try {
    const provider = window.solana;
    if (!provider || !provider.isPhantom) {
      alert("Phantom Wallet not found");
      return;
    }
    const resp = await provider.connect();
    document.getElementById("wallet-display").innerText = `🔐 ${resp.publicKey.toString()}`;
  } catch (err) {
    console.error("Wallet connection failed:", err);
  }
}
// 🧼 UI Clean Patch: Removed footer logs, cleared chat input, scoped PulseIt
  if (input.includes("etf") || input.includes("war")) { output.innerHTML = `<strong>PulseIt:</strong> ${sentiment}<br/><em>${explanation}</em>`; }
