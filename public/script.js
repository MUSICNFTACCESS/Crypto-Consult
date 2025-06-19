const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-button");
const sentimentResult = document.getElementById("sentiment-result");
const sentimentQuery = document.getElementById("sentiment-query");
const btcPrice = document.getElementById("btc-price");
const ethPrice = document.getElementById("eth-price");
const solPrice = document.getElementById("sol-price");
const paymentSection = document.getElementById("payment-options");

let questionCount = 0;
const maxFreeQuestions = 3;

async function handleCrimznBot(question) {
  chatBox.innerHTML += `<div class="user">🧑🏽‍💻 ${question}</div>`;
  input.value = "";

  if (++questionCount >= maxFreeQuestions) {
    chatBox.innerHTML += `
      <div class="bot">⚠️ Free limit reached. Please
        <a class="button coinbase-button" href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" target="_blank">💳 Book Consultation</a>
        <a class="button coinbase-button" href="https://commerce.coinbase.com/checkout/1d7cd946-d6ec-4278-b7ea-ee742b86982b" target="_blank">💰 Tip 1 USDC</a>
        <a class="button solana-button" href="solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=0.025&label=CryptoConsult&message=Consultation%20Payment">👻 Pay with Solana</a>
        <a class="button" href="mailto:crimzncipriano@gmail.com">📩 Contact Crimzn</a>
      </div>`;
    paymentSection.style.display = "block";
    return;
  }

  try {
    const res = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    const answer = data.answer?.toLowerCase();

    const fallback = answer.includes("i'm unable to provide real-time data");
    const isPriceQuestion = question.toLowerCase().includes("price") || question.toLowerCase().includes("marketcap");

    if (fallback && isPriceQuestion) {
      const term = question.toLowerCase().includes("sol") ? "solana" :
                   question.toLowerCase().includes("eth") ? "ethereum" : "bitcoin";
      const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${term}&vs_currencies=usd`);
      const json = await priceRes.json();
      const price = json[term]?.usd;
      chatBox.innerHTML += `<div class="bot">🟢 The current price of ${term.toUpperCase()} is $${price.toLocaleString()}</div>`;
    } else {
      chatBox.innerHTML += `<div class="bot">🟢 ${data.answer}</div>`;
    }
  } catch (err) {
    chatBox.innerHTML += `<div class="bot">❌ Error fetching CrimznBot response</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.onclick = () => {
  const q = input.value.trim();
  if (q) handleCrimznBot(q);
};

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const q = input.value.trim();
    if (q) handleCrimznBot(q);
  }
});

async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    btcPrice.textContent = "$" + data.bitcoin.usd.toLocaleString();
    ethPrice.textContent = "$" + data.ethereum.usd.toLocaleString();
    solPrice.textContent = "$" + data.solana.usd.toLocaleString();
  } catch {
    btcPrice.textContent = "$Error";
    ethPrice.textContent = "$Error";
    solPrice.textContent = "$Error";
  }
}

async function getSentiment() {
  const query = sentimentQuery.value.trim();
  if (!query) {
    sentimentResult.innerText = "❌ Enter a term.";
    return;
  }

  sentimentResult.innerText = "🔎 Analyzing sentiment for \"" + query + "\"...";

  try {
    const res = await fetch("https://crypto-consult.onrender.com/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    sentimentResult.innerText = `🟢 Sentiment for "${query}": ${data.summary || "Neutral"} (${data.sentiment_score || "N/A"})`;
  } catch {
    sentimentResult.innerText = "❌ Error analyzing sentiment.";
  }

  sentimentQuery.value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  fetchPrices();
  setInterval(fetchPrices, 60000);
});
