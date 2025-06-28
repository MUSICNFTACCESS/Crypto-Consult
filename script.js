let questionCount = 0;

async function askCrimznBot() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const question = input.value.trim();
  input.value = "";
  input.focus();

  if (!question) return;

  if (questionCount >= 3) {
    chatBox.innerHTML += `
      <div style="margin-top: 1em;">
        <p><strong>Limit Reached</strong> – Please pay to continue:</p>
        <button class="paywall-button" onclick="window.open('https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8')">Pay $99.99 USDC</button>
        <button class="paywall-button" onclick="window.open('https://commerce.coinbase.com/checkout/1d7cd946-d6ec-4278-b7ea-ee742b86982b')">Tip 1 USDC</button>
        <button class="paywall-button" onclick="window.open('https://www.paypal.me/crimzn')">Pay with PayPal</button>
        <a class="solana-button" href="https://solana-pay-link.example.com" target="_blank">
          <img src="solana-logo.svg" alt="Solana Logo" height="16" style="vertical-align: middle; margin-right: 8px;">
          Pay with Solana
        </a>
      </div>
    `;
    return;
  }

  chatBox.innerHTML += `<p style="color: #f7931a;"><strong>You:</strong> ${question}</p>`;

  try {
    const res = await fetch("https://crypto-consult.onrender.com/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    chatBox.innerHTML += `<p style="color: #00ff00;"><strong>CrimznBot:</strong> ${data.answer}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    questionCount++;
  } catch (err) {
    chatBox.innerHTML += `<p style="color: red;">⚠️ Error getting response.</p>`;
  }
}

function analyzeSentiment() {
  const input = document.getElementById("sentimentInput").value.toLowerCase();
  const output = document.getElementById("pulseOutput");

  let sentiment = "Neutral 🟨";
  if (input.includes("war") || input.includes("regulation") || input.includes("hacked")) {
    sentiment = "Bearish 🟥";
  } else if (input.includes("etf") || input.includes("adoption") || input.includes("bullish")) {
    sentiment = "Bullish 🟩";
  }

  output.textContent = `PulseIt: ${sentiment}`;
}

async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("btc").textContent = `BTC: $${data.bitcoin.usd.toLocaleString()}`;
    document.getElementById("eth").textContent = `ETH: $${data.ethereum.usd.toLocaleString()}`;
    document.getElementById("sol").textContent = `SOL: $${data.solana.usd.toLocaleString()}`;
  } catch (e) {
    console.error("Price fetch failed:", e);
  }
}

window.onload = () => {
  fetchPrices();
  setInterval(fetchPrices, 60000); // Auto-refresh prices every 60s
  document.getElementById("userInput").focus();
};
