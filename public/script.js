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
  userMessage.innerText = `🟠 ${question}`;
  chatContainer.appendChild(userMessage);

  // Clear input
  userInput.value = "";
  chatContainer.scrollTop = chatContainer.scrollHeight;

  questionCount++;

  if (questionCount >= 3) {
    const limitMessage = document.createElement("div");
    limitMessage.className = "bot-message";
    limitMessage.innerHTML = `
      🛑 You've reached the free limit. Please pay to continue.<br/><br/>
      <button onclick="window.open('https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8', '_blank')">Pay for Consultation</button>
      <button onclick="window.open('https://commerce.coinbase.com/checkout/6e5ff5c3-6bc2-4c8e-874a-f39e877c9d10', '_blank')">Tip Crimzn (1 USDC)</button>
      <button onclick="window.open('https://solana.com/pay', '_blank')">Pay With Solana</button>
      <button onclick="window.open('https://t.me/CrimznBot', '_blank')">Chat with CrimznBot</button>
    `;
    chatContainer.appendChild(limitMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return;
  }

  // Add bot loading placeholder
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


// 💡 PulseIt Sentiment
const pulseForm = document.getElementById("pulse-form");
pulseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("pulse-input").value;

  try {
    const res = await fetch("/pulseit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    document.getElementById("pulse-result").innerText =
      data.response || "⚠️ No sentiment detected.";
  } catch (err) {
    document.getElementById("pulse-result").innerText = "❌ Error fetching sentiment.";
    console.error(err);
  }
});




