let questionCount = 0;

document.addEventListener("DOMContentLoaded", () => {
  const chatContainer = document.getElementById("chat-container");
  const userInput = document.getElementById("user-input");
  const submitButton = document.getElementById("submit-button");
  const pulseForm = document.getElementById("pulse-form");

  // 💸 Live Prices
  async function updatePrices() {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
      const data = await res.json();
      document.getElementById("btc-price").innerText = `$${data.bitcoin.usd}`;
      document.getElementById("eth-price").innerText = `$${data.ethereum.usd}`;
      document.getElementById("sol-price").innerText = `$${data.solana.usd}`;
    } catch (err) {
      console.error("Price fetch error:", err);
      document.getElementById("btc-price").innerText = "Error";
      document.getElementById("eth-price").innerText = "Error";
      document.getElementById("sol-price").innerText = "Error";
    }
  }

  updatePrices();
  setInterval(updatePrices, 60000); // Update every 60s

  // 🧠 CrimznBot Handler
  submitButton.addEventListener("click", async () => {
    const question = userInput.value.trim();
    if (!question) return;

    const userMessage = document.createElement("div");
    userMessage.className = "user-message";
    userMessage.innerText = `🟠 ${question}`;
    chatContainer.appendChild(userMessage);
    userInput.value = "";
    chatContainer.scrollTop = chatContainer.scrollHeight;

    questionCount++;

    if (questionCount > 3) {
      // 🧼 Clear only when showing the paywall
      chatContainer.innerHTML = "";
      const paywall = document.createElement("div");
      paywall.className = "bot-message";
      paywall.innerHTML = `
        🛑 You've reached the free limit. Please pay to continue.<br><br>
        <button onclick="window.open('https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8', '_blank')">💸 Pay for Consultation</button>
        <button onclick="window.open('https://commerce.coinbase.com/checkout/6e5ff5c3-6bc2-4c8e-874a-f39e877c9d10', '_blank')">🙏 Tip Crimzn (1 USDC)</button>
        <button onclick="window.open('https://phantom.app/ul/browse/www.solanapay.com/pay/Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=0.025', '_blank')">👻 Pay with Solana</button>
        <button onclick="window.open('https://t.me/CrimznBot', '_blank')">🤖 Chat with CrimznBot</button>
      `;
      chatContainer.appendChild(paywall);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      return;
    }

    const botMessage = document.createElement("div");
    botMessage.className = "bot-message";
    botMessage.innerText = "🧠 CrimznBot is thinking...";
    chatContainer.appendChild(botMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      botMessage.innerText = `🟢 CrimznBot: ${data.response || "No response from CrimznBot."}`;
    } catch (err) {
      botMessage.innerText = "❌ Error: Unable to get response from CrimznBot.";
      console.error(err);
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
  });

  // 📡 PulseIt Sentiment Handler
  pulseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("pulse-input");
    const result = document.getElementById("pulse-result");
    const message = input.value.trim();
    if (!message) return;

    result.innerText = "🔍 Scanning...";
    input.value = "";

    try {
      const res = await fetch("/pulseit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();
      result.innerText = data.response || "⚠️ No sentiment detected.";
    } catch (err) {
      result.innerText = "❌ Error fetching sentiment.";
      console.error(err);
    }
  });
});
