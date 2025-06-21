const input = document.getElementById("chat-input");
const chatbox = document.getElementById("chat-box");
const sentimentQuery = document.getElementById("sentiment-query");
const sentimentResult = document.getElementById("sentiment-result");

let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
const maxFreeQuestions = 3;

async function handleUserInput(question) {
  if (questionCount >= maxFreeQuestions) {
    if (!localStorage.getItem("paywallTriggered")) {
      chatbox.innerHTML = `
        <div class="bot">🔥 Free limit reached. Please choose a support option:<br/><br/>
          <a class="button main-button" href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" target="_blank">💳 Pay $99.99 USDC</a>
          <a class="button main-button" href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" target="_blank">🎁 Tip 1 USDC</a>
          <a class="button main-button" href="https://solpay.magic.link/pay?recipient=Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF&amount=0.02&label=CrimznConsult" target="_blank">⚡ Pay with Solana</a>
          <a class="button main-button" href="mailto:crimzncipriano@gmail.com">📩 Contact Crimzn</a>
        </div>`;
      localStorage.setItem("paywallTriggered", "true");
    }
    input.disabled = true;
    return;
  }

  chatbox.innerHTML += `<div class="user">🧑 ${question}</div>`;
  input.value = "";

  try {
    const response = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: question })
    });

    const data = await response.json();

    if (data.answer) {
      chatbox.innerHTML += `<div class="bot">🧠 ${data.answer}</div>`;
    } else {
      chatbox.innerHTML += `<div class="bot">❌ No answer returned. Try again.</div>`;
    }
  } catch (err) {
    chatbox.innerHTML += `<div class="bot">⚠️ Error fetching CrimznBot response</div>`;
  }

  questionCount++;
  localStorage.setItem("questionCount", questionCount);
  chatbox.scrollTop = chatbox.scrollHeight;
}

input.onkeypress = function (e) {
  if (e.key === "Enter") {
    const question = input.value.trim();
    if (question) {
      handleUserInput(question);
    }
  }
};

async function getSentiment() {
  const term = sentimentQuery.value.trim();
  if (!term) {
    sentimentResult.innerText = "❌ Enter a term.";
    return;
  }

  sentimentResult.innerText = "⏳ Analyzing sentiment...";
  try {
    const res = await fetch("https://crypto-consult.onrender.com/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: term })
    });
    const data = await res.json();
    sentimentResult.innerText = `📊 Sentiment: ${data.summary} (${data.sentiment_score})`;
  } catch (err) {
    sentimentResult.innerText = "❌ Sentiment failed.";
  }

  sentimentQuery.value = "";
}

async function updatePrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("btc-price").textContent = `$${data.bitcoin.usd.toLocaleString()}`;
    document.getElementById("eth-price").textContent = `$${data.ethereum.usd.toLocaleString()}`;
    document.getElementById("sol-price").textContent = `$${data.solana.usd.toLocaleString()}`;
  } catch (err) {
    console.error("⚠️ Failed to fetch live prices:", err.message);
  }
}

async function fetchFearAndGreedIndex() {
  try {
    const res = await fetch("https://api.alternative.me/fng/");
    const data = await res.json();
    const value = data.data[0].value;
    const classification = data.data[0].value_classification;
    document.getElementById("fear-greed").textContent = `${value} - ${classification}`;
  } catch (err) {
    document.getElementById("fear-greed").textContent = "N/A";
  }
}

async function fetchBTCDominance() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global");
    const data = await res.json();
    const dominance = data.data.market_cap_percentage.btc || 0;
    document.getElementById("btc-dominance").textContent = `${dominance.toFixed(1)}%`;
  } catch (err) {
    console.error("⚠️ Failed to fetch BTC Dominance:", err.message);
  }
}

// Run on load
updatePrices();
fetchFearAndGreedIndex();
fetchBTCDominance();
