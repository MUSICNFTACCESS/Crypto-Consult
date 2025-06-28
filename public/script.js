let questionCount = 0;
const maxQuestions = 3;

document.getElementById("ask-btn").onclick = async () => {
  const input = document.getElementById("user-input");
  const chat = document.getElementById("chat-output");
  const question = input.value.trim();
  if (!question) return;

  // Clear previous CrimznBot response
  chat.innerHTML = `<div style="color:#f7931a;"><strong>You:</strong> ${question}</div>`;
  input.value = "";

  if (questionCount >= maxQuestions) {
    chat.innerHTML = `
      <div style="color:limegreen;"><strong>CrimznBot:</strong> Access limit reached. To continue, please send 0.025 SOL:</div>
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
    chat.innerHTML = `<div style="color: red;">⚠️ CrimznBot is offline or encountered an error.</div>`;
  }

  // Scroll fix
  chat.scrollTop = chat.scrollHeight;
};

document.getElementById("analyze-btn").onclick = () => {
  const input = document.getElementById("sentimentInput").value.toLowerCase();
  const output = document.getElementById("pulseOutput");

  // Clear previous PulseIt result
  output.innerHTML = "";

  let sentiment = "Neutral 🟨";
  if (input.includes("war") || input.includes("regulation") || input.includes("hacked") || input.includes("scam") || input.includes("dump")) {
    sentiment = "Bearish 🟥";
  } else if (input.includes("etf") || input.includes("adoption") || input.includes("bullish") || input.includes("innovation")) {
    sentiment = "Bullish 🟩";
  }

  output.innerHTML = `<strong>PulseIt:</strong> ${sentiment}`;
};
// 🚀 Force redeploy Sat Jun 28 19:20:11 EDT 2025
