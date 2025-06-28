let questionCount = 0;
const maxFreeQuestions = 3;

document.getElementById("ask-btn").onclick = async () => {
  const input = document.getElementById("user-input");
  const chat = document.getElementById("chat-output");
  const question = input.value.trim();
  if (!question) return;

  chat.innerHTML = `<div style="color:#f7931a;"><strong>You:</strong> ${question}</div>` + chat.innerHTML;
  input.value = "";

  if (questionCount >= maxFreeQuestions) {
    chat.innerHTML = `
      <div style="color:limegreen;"><strong>CrimznBot:</strong> You've hit your free limit. To unlock full access, send 0.025 SOL:</div>
      <a href="solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=0.025&label=CryptoConsult%20Access" target="_blank">
        <img src="solana-logo.svg" alt="Solana Pay" style="width:80px;" />
      </a>
    ` + chat.innerHTML;
    return;
  }

  questionCount++;

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question })
    });

    const data = await res.json();

    chat.innerHTML = `
      <div style="color:limegreen;"><strong>CrimznBot:</strong> ${data.response}</div>
      <div style="font-size:0.9em;">📊 PulseIt Sentiment: ${data.pulse}</div>
    ` + chat.innerHTML;
  } catch (err) {
    chat.innerHTML = `<div style="color:red;"><strong>Error:</strong> ${err.message}</div>` + chat.innerHTML;
  }
};

document.getElementById("pulse-btn").onclick = async () => {
  const input = document.getElementById("pulse-input");
  const pulseOutput = document.getElementById("pulse-output");
  const phrase = input.value.trim();
  if (!phrase) return;

  pulseOutput.innerHTML = `<div style="color:#f7931a;"><strong>You:</strong> ${phrase}</div>` + pulseOutput.innerHTML;
  input.value = "";

  try {
    const res = await fetch("/api/pulse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline: phrase })
    });

    const data = await res.json();
    pulseOutput.innerHTML = `<div style="color:limegreen;"><strong>PulseIt:</strong> ${data.sentiment}</div>` + pulseOutput.innerHTML;
  } catch (err) {
    pulseOutput.innerHTML = `<div style="color:red;"><strong>Error:</strong> ${err.message}</div>` + pulseOutput.innerHTML;
  }
};

async function fetchPrices() {
  try {
    const res = await fetch("/api/prices");
    const data = await res.json();
    document.getElementById("btc-price").textContent = "$" + data.price.bitcoin.usd;
    document.getElementById("eth-price").textContent = "$" + data.price.ethereum.usd;
    document.getElementById("sol-price").textContent = "$" + data.price.solana.usd;
  } catch {
    document.getElementById("btc-price").textContent = "N/A";
    document.getElementById("eth-price").textContent = "N/A";
    document.getElementById("sol-price").textContent = "N/A";
  }
}

fetchPrices();
setInterval(fetchPrices, 60000);
