const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-button");
const sentimentResult = document.getElementById("sentiment-result");
const sentimentQuery = document.getElementById("sentiment-query");
const btcPrice = document.getElementById("btc-price");
const ethPrice = document.getElementById("eth-price");
const solPrice = document.getElementById("sol-price");
const paymentSection = document.getElementById("payment-options");

let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
const maxFreeQuestions = 3;

// 🤖 CrimznBot Handler
async function handleCrimznBot(question) {
  chatBox.innerHTML += `<div class="user">🙋‍♂️📘 ${question}</div>`;
  input.value = "";

  if (questionCount >= maxFreeQuestions) {
    if (!localStorage.getItem("paywallTriggered")) {
      chatBox.innerHTML = `
        <div class="bot" id="paywall-message">⚠️ Free limit reached. Please<br/>
          <a class="button coinbase-button" href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" target="_blank">💼 Pay $99.99 USDC</a>
          <a class="button coinbase-button" href="https://commerce.coinbase.com/checkout/1d7cd946-d6ec-4278-b70a-ee747b098b20" target="_blank">🫰 Tip 1 USDC</a>
          <a class="button solana-button" href="solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=0.025&label=CrimznConsult&message=Consultation%20Access" target="_blank">🔓 Unlock with Solana</a>
          <a class="button" href="mailto:crimzncipriano@gmail.com">📧 Contact Crimzn</a>
        </div>`;
      localStorage.setItem("paywallTriggered", "true");
    }
    input.disabled = true;
    sendBtn.disabled = true;
    return;
  }

  try {
    const res = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();

    if (data.answer) {
      chatBox.innerHTML += `<div class="bot">🟢 ${data.answer}</div>`;
      questionCount++;
      localStorage.setItem("questionCount", questionCount);
    } else {
      chatBox.innerHTML += `<div class="bot">❌ No answer returned. Try again.</div>`;
    }
  } catch (err) {
    chatBox.innerHTML += `<div class="bot">❌ Error fetching CrimznBot response</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🟠 CrimznBot Send Button
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

// 💰 Live Price Feed
async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    btcPrice.textContent = "$" + data.bitcoin.usd.toLocaleString();
    ethPrice.textContent = "$" + data.ethereum.usd.toLocaleString();
    solPrice.textContent = "$" + data.solana.usd.toLocaleString();
  } catch (err) {
    btcPrice.textContent = "❌";
    ethPrice.textContent = "❌";
    solPrice.textContent = "❌";
  }
}

// 📊 PulseIt Sentiment Tracker
async function getSentiment() {
  const query = sentimentQuery.value.trim();
  if (!query) {
    sentimentResult.innerText = "❌ Enter a term.";
    return;
  }

  sentimentResult.innerText = `🔍 Analyzing sentiment for "${query}"...`;

  try {
    const res = await fetch("https://crypto-consult.onrender.com/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    sentimentResult.innerText = `📈 Sentiment for "${query}": ${data.summary || "Neutral"} (${data.sentiment_score || "N/A"})`;
  } catch (err) {
    sentimentResult.innerText = "❌ Error analyzing sentiment.";
  }

  sentimentQuery.value = "";
}

// ⏱️ Initial Load
document.addEventListener("DOMContentLoaded", () => {
  fetchPrices();
  setInterval(fetchPrices, 60000);
});
