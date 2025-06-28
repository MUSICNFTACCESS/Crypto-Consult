let questionCount = 0;
const maxQuestions = 3;

document.addEventListener("DOMContentLoaded", () => {
  const askBtn = document.getElementById("ask-btn");
  const input = document.getElementById("user-input");
  const chat = document.getElementById("chat-output");

  askBtn.onclick = async () => {
    const question = input.value.trim();
    if (!question) return;

    chat.innerHTML = `<div style="color:#f7931a;"><strong>You:</strong> ${question}</div>`;
    input.value = "";

    if (questionCount >= maxQuestions) {
      chat.innerHTML = `
        <div style="color:limegreen;"><strong>CrimznBot:</strong> You've hit your free question limit. Please pay to continue:</div>
        <a href="solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=0.025&label=CrimznConsult" target="_blank">
          <img src="solana-logo.svg" alt="Solana Pay" style="width:80px;" />
        </a>
      `;
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
      `;
    } catch (err) {
      chat.innerHTML = `<div style="color:red;">⚠️ CrimznBot is offline or encountered an error.</div>`;
    }

    chat.scrollTop = chat.scrollHeight;
  };

  const analyzeBtn = document.getElementById("analyze-btn");
  analyzeBtn.onclick = () => {
    const inputText = document.getElementById("sentimentInput").value.toLowerCase();
    const output = document.getElementById("pulseOutput");

    output.innerHTML = ""; // Clear previous output

    let sentiment = "Neutral 🟨";
    if (inputText.includes("war") || inputText.includes("regulation") || inputText.includes("hacked") || inputText.includes("scam") || inputText.includes("dump")) {
      sentiment = "Bearish 🟥";
    } else if (inputText.includes("etf") || inputText.includes("adoption") || inputText.includes("bullish") || inputText.includes("innovation")) {
      sentiment = "Bullish 🟩";
    }

    output.innerHTML = `<strong>PulseIt:</strong> ${sentiment}`;
  };
});
