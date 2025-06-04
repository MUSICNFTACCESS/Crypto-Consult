let messageCount = 0;

async function sendMessage(event) {
  event.preventDefault();

  const input = document.getElementById("user-input");
  const chatLog = document.getElementById("chat-log");
  const paymentOptions = document.getElementById("payment-options");

  if (messageCount >= 3) {
    paymentOptions.style.display = "block";
    input.disabled = true;
    return;
  }

  const userMessage = input.value.trim();
  if (!userMessage) return;

  const userDiv = document.createElement("div");
  userDiv.className = "user";
  userDiv.textContent = "You: " + userMessage;
  chatLog.appendChild(userDiv);

  input.value = "";
  messageCount++;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await response.json();

    const botDiv = document.createElement("div");
    botDiv.className = "bot";
    botDiv.textContent = "CrimznBot: " + (data.reply || "Sorry, no response.");
    chatLog.appendChild(botDiv);
  } catch (error) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "bot";
    errorDiv.textContent = "CrimznBot: ⚠️ Error processing your request.";
    chatLog.appendChild(errorDiv);
  }

  chatLog.scrollTop = chatLog.scrollHeight;
}

// Price fetch logic
async function fetchPrices() {
  try {
    const res = await fetch("/prices");
    const data = await res.json();
    document.getElementById("btc-price").textContent = data.btc.toLocaleString();
    document.getElementById("eth-price").textContent = data.eth.toLocaleString();
    document.getElementById("sol-price").textContent = data.sol.toLocaleString();
  } catch (e) {
    console.error("Failed to fetch prices", e);
  }
}

// Fetch prices every 60 seconds
fetchPrices();
setInterval(fetchPrices, 60000);
