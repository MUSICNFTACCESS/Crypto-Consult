window.onload = () => {
  let questionCount = 0;

  const chatContainer = document.getElementById("chat-container");
  const userInput = document.getElementById("user-input");
  const submitButton = document.getElementById("submit-button");

  submitButton.addEventListener("click", async () => {
    const question = userInput.value.trim();
    if (!question) return;

    // Add user message
    const userMessage = document.createElement("div");
    userMessage.className = "user-message";
    userMessage.innerText = question;
    chatContainer.appendChild(userMessage);

    userInput.value = "";

    questionCount++;

    if (questionCount >= 3) {
      const limitMsg = document.createElement("div");
      limitMsg.className = "limit-message";
      limitMsg.innerHTML = `
        You've reached the free limit. Please pay to continue.<br/><br/>
        <button onclick="window.open('https://commerce.coinbase.com/checkout/0193a8a5-c86f-4076-b5d7-6f89664fbdf8', '_blank')">Pay for Consultation</button>
        <button onclick="window.open('https://commerce.coinbase.com/checkout/1d7cd946-d6ec-4278-b7ea-ee742b86982b', '_blank')">Tip Crimzn (1 USDC)</button>
        <button onclick="window.open('https://solana.com/pay', '_blank')">Pay With Solana</button>
        <button onclick="window.open('https://t.me/CrimznBot', '_blank')">Chat with CrimznBot</button>
      `;
      chatContainer.appendChild(limitMsg);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      return;
    }

    // Add loading placeholder
    const loading = document.createElement("div");
    loading.className = "bot-message";
    loading.innerText = "⏳ CrimznBot is thinking...";
    chatContainer.appendChild(loading);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const data = await res.json();
      loading.innerText = `✅ CrimznBot: ${data.response || "No response from CrimznBot."}`;
    } catch (err) {
      loading.innerText = "❌ Error: Unable to get response from CrimznBot.";
      console.error(err);
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
  });

  // 🔍 PulseIt Sentiment
  const pulseForm = document.getElementById("pulse-form");
  const pulseButton = document.getElementById("pulse-button");

  pulseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("pulse-input").value;

    try {
      const res = await fetch("/pulseIt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();
      document.getElementById("pulse-result").innerText = data.response || "❓ No sentiment detected.";
    } catch (err) {
      document.getElementById("pulse-result").innerText = "❌ Error fetching sentiment.";
      console.error(err);
    }
  });
};
