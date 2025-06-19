// 🔌 Element References
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendButton = document.getElementById("send-button");
const paymentSection = document.getElementById("payment-options");
const btcPrice = document.getElementById("btc-price");
const ethPrice = document.getElementById("eth-price");
const solPrice = document.getElementById("sol-price");
const sentimentResult = document.getElementById("sentiment-result");
const sentimentQuery = document.getElementById("sentiment-query");

let questionCount = 0;
const maxFreeQuestions = 3;

// 🤖 Handle CrimznBot Chat
async function handleCrimznBot(question) {
  chatBox.innerHTML += `<div class="user">🙋🏽‍♂️ ${question}</div>`;
  input.value = "";

  if (questionCount >= maxFreeQuestions) {
    chatBox.innerHTML += `
      <div class="bot">
        ⚠️ Free limit reached. Please 
        <a class="button" href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" target="_blank">Pay to Continue</a>
        or 
        <a class="button" href="https://t.me/CrimznBot" target="_blank">📬 Contact Crimzn</a>
      </div>`;
    paymentSection?.style?.display = "block";
    return;
  }

  try {
    const res = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    chatBox.innerHTML += `<div class="bot">🤖 ${data.answer}</div>`;
    questionCount++;
  } catch (err) {
    chatBox.innerHTML += `<div class="bot">❌ Error: Failed to fetch response</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🚀 Send Button & Enter Key Events
sendButton.onclick = () => {
  const question = input.value.trim();
  if (question) handleCrimznBot(question);
};

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const question = input.value.trim();
    if (question) handleCrimznBot(question);
  }
});

// 💰 Fetch Prices via Backend Proxy
async function fetchPrices() {
  try {
    const res = await fetch("https://crypto-consult.onrender.com/prices");
    const data = await res.json();
    btcPrice.textContent = "$" + data.btc.toLocaleString();
    ethPrice.textContent = "$" + data.eth.toLocaleString();
    solPrice.textContent = "$" + data.sol.toLocaleString();
  } catch {
    btcPrice.textContent = "$Error";
    ethPrice.textContent = "$Error";
    solPrice.textContent = "$Error";
  }
}

// 📊 Alpha Pulse Tracker+
async function getSentiment() {
  const query = sentimentQuery.value.trim();
  if (!query) {
    sentimentResult.innerText = "❌ Enter a term";
    return;
  }

  sentimentResult.innerText = `🔍 Analyzing sentiment for "${query}"...`;

  try {
    const res = await fetch("https://crypto-consult.onrender.com/api/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    sentimentResult.innerText = `📈 Sentiment for "${query}": ${data.summary || "Neutral"} (${data.sentiment_score || "N/A"})`;
  } catch {
    sentimentResult.innerText = "❌ Error analyzing sentiment.";
  }
}

// 🔐 Wallet Connect Logic
async function connectWallet() {
  if (window.solana && window.solana.isPhantom) {
    try {
      const res = await window.solana.connect();
      const pubkey = res.publicKey.toString();
      document.getElementById("wallet-address").textContent = "🔗 " + pubkey;
      document.getElementById("connect-btn").style.display = "none";
      document.getElementById("disconnect-btn").style.display = "inline-block";
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  } else {
    alert("Phantom Wallet not detected. Please install it.");
  }
}

function disconnectWallet() {
  document.getElementById("wallet-address").textContent = "❌ Not connected";
  document.getElementById("connect-btn").style.display = "inline-block";
  document.getElementById("disconnect-btn").style.display = "none";
}

// 📦 On Load
document.addEventListener("DOMContentLoaded", () => {
  fetchPrices();
  setInterval(fetchPrices, 60000);

  document.getElementById("connect-btn").addEventListener("click", connectWallet);
  document.getElementById("disconnect-btn").addEventListener("click", disconnectWallet);
});
