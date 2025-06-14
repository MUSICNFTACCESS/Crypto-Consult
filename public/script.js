const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const pricesDiv = document.getElementById("prices");
const sendButton = document.getElementById("send-button");
const paymentSection = document.getElementById("payment-options");
const sentimentResult = document.getElementById("sentiment-result");
const sentimentQuery = document.getElementById("sentiment-query");

let questionCount = 0;
const maxFreeQuestions = 3;

async function handleCrimznBot(question) {
  chatBox.innerHTML += `<div class="user">🙋🏽‍♂️ ${question}</div>`;
  input.value = "";

  if (questionCount >= maxFreeQuestions) {
    chatBox.innerHTML += `<div class="bot">⚠️ Free limit reached. Please <a class="button" href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8">pay to continue</a>.</div>`;
    paymentSection.style.display = "block";
    return;
  }

  try {
    const res = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    chatBox.innerHTML += `<div class="bot">🤖 ${data.answer}</div>`;
    questionCount++;
  } catch (err) {
    chatBox.innerHTML += `<div class="bot">❌ Error: Failed to fetch</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

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

// Fetch crypto prices
async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    pricesDiv.innerText = `BTC: $${data.bitcoin.usd.toLocaleString()} | ETH: $${data.ethereum.usd.toLocaleString()} | SOL: $${data.solana.usd.toLocaleString()}`;
  } catch (err) {
    pricesDiv.innerText = "Price fetch error";
  }
}

fetchPrices();
setInterval(fetchPrices, 60000);

// Alpha Pulse Tracker+
window.getSentiment = async function () {
  const query = sentimentQuery?.value?.trim();
  if (!query) return;

  sentimentResult.innerText = `Analyzing sentiment for "${query}"...`;

  try {
    const res = await fetch("/api/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    sentimentResult.innerText = `Sentiment for "${query}": ${data.summary || "Neutral"} (${data.tally || "N/A"})`;
  } catch (e) {
    sentimentResult.innerText = "Error analyzing sentiment.";
  }
};
