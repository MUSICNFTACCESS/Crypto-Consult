const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-button");
const sentimentQuery = document.getElementById("sentiment-query");
const sentimentResult = document.getElementById("sentiment-result");

let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
const maxFreeQuestions = 3;

async function handleCrimznBot(question) {
  if (questionCount >= maxFreeQuestions) {
    if (!localStorage.getItem("paywallTriggered")) {
      chatBox.innerHTML = ""; // clear chat
      chatBox.innerHTML = `
        <div class="bot" id="paywall-message">
          ⚠️ Free limit reached. Please choose a support option:<br/><br/>
          <a class="button coinbase-button" href="https://commerce.coinbase.com/checkout/0193a8a5-c86f-407d-b5d7-6f89664fbdf8" target="_blank">💼 Pay $99.99</a>
          <a class="button coinbase-button" href="https://commerce.coinbase.com/checkout/1d7cd946-d6ec-4278-b7ea-ee742b86982b" target="_blank">🫰 Tip 1 USDC</a>
          <a class="button solana-button" href="solana:Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF?amount=0.025&label=CrimznConsult&message=Consultation%20Support" target="_blank">⚡ Pay with Solana</a>
          <a class="button" href="mailto:crimzncipriano@gmail.com">📧 Contact Crimzn</a>
        </div>`;
      localStorage.setItem("paywallTriggered", "true");
    }
    input.disabled = true;
    sendBtn.disabled = true;
    return;
  }

  chatBox.innerHTML += `<div class="user">🙋‍♂️📘 ${question}</div>`;
  input.value = "";

  try {
    const res = await fetch("https://crypto-consult.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    const answer = data.answer?.trim() || "❌ No answer returned. Try again.";
    chatBox.innerHTML += `<div class="bot">🟢 ${answer}</div>`;
  } catch {
    chatBox.innerHTML += `<div class="bot">❌ Error fetching CrimznBot response</div>`;
  }

  questionCount++;
  localStorage.setItem("questionCount", questionCount);
  chatBox.scrollTop = chatBox.scrollHeight;
}

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

async function getSentiment() {
  const term = sentimentQuery.value.trim();
  if (!term) {
    sentimentResult.innerText = "❌ Enter a term.";
    return;
  }
  sentimentResult.innerText = `🔍 Analyzing sentiment...`;
  try {
    const res = await fetch("https://crypto-consult.onrender.com/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: term })
    });
    const data = await res.json();
    sentimentResult.innerText = `📈 ${data.summary} (${data.sentiment_score})`;
  } catch {
    sentimentResult.innerText = "❌ Sentiment failed.";
  }
  sentimentQuery.value = "";
}
