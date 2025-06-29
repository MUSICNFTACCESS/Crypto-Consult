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
        botReply = "⚠️ Sorry, something went sideways — try again or drop me a tip to keep me sharp."; // Crimzn-style fallback

// 💬 CrimznBot Logic
chatSubmit.onclick = async function () {
  const input = chatInput.value.trim();
  if (!input) return;
  chatMessages.innerHTML = `<div class="user-msg">${input}</div>`;
  chatInput.value = "";

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input })
    });
    const data = await res.json();
    chatMessages.innerHTML += `<div class="bot-msg">${data.answer}</div>`;
  } catch (err) {
    chatMessages.innerHTML += `<div class="bot-msg">Error. Please try again later.</div>`;
  }
};

// 📊 PulseIt Logic
document.getElementById("analyzeButton").onclick = function () {
  const userInput = document.getElementById("pulseInput").value.toLowerCase();
  let sentiment = "Neutral", icon = "🟡", explanation = "No strong signals detected.";

  if (userInput.includes("etf") || userInput.includes("bitcoin")) {
    sentiment = "Bullish"; icon = "🟢"; explanation = "ETF flows suggest strong market support.";
  } else if (userInput.includes("war") || userInput.includes("election")) {
    sentiment = "Bearish"; icon = "🔴"; explanation = "Geopolitical uncertainty affecting sentiment.";
  }

  const output = document.getElementById("pulseOutput");
  output.innerHTML = `<strong>PulseIt Sentiment:</strong> ${icon} ${sentiment}<br/><em>${explanation}</em>`;
  document.getElementById("pulseInput").value = "";
};
function chatSubmit() {
  const input = document.getElementById("chatInput").value.trim();
  if (!input) return;
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = "";
  fetch("/ask", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ question: input })
  })
  .then(res => res.json())
  .then(data => {
    chatMessages.innerHTML = `<span style="color:#f7931a;"><strong>You:</strong> ${input}</span><br><span style="color:#00ff00;"><strong>CrimznBot:</strong> ${data.answer}</span>`;
    document.getElementById("chatInput").value = "";
  });
}
function pulseAnalyze() {
  const input = document.getElementById("pulseInput").value.trim().toLowerCase();
  const output = document.getElementById("pulseOutput");
  let sentiment = "Neutral";
  let explanation = "No strong bias detected.";
  if (input.includes("etf") || input.includes("bullish") || input.includes("crypto")) {
    sentiment = "Bullish";
    explanation = "Positive developments or optimism detected.";
  } else if (input.includes("war") || input.includes("regulation") || input.includes("dump")) {
    sentiment = "Bearish";
    explanation = "Concerns or negative developments noted.";
  }
  output.innerHTML = `<strong>PulseIt:</strong> ${sentiment}<br><em>${explanation}</em>`;
  document.getElementById("pulseInput").value = "";
}
