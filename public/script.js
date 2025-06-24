let questionCount = 0;

async function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;

  questionCount++;
  document.getElementById('chat-box').innerHTML = `<p class="user">You: ${message}</p>`;

  if (questionCount > 3) {
    document.getElementById('paywall').style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: message })
    });

    const data = await res.json();
    const botReply = data.response || "🧠 CrimznBot couldn't process that. Try again.";
    document.getElementById('chat-box').innerHTML = `<p class="bot">${botReply}</p>`;
  } catch (err) {
    document.getElementById('chat-box').innerHTML = `<p class="bot">❌ CrimznBot error: ${err.message}</p>`;
  }

  input.value = '';
}

async function analyzePulse() {
  const input = document.getElementById('pulse-input').value;
  const output = document.getElementById('pulse-output');

  if (!input) return;

  try {
    const res = await fetch('/api/pulse/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    const response = data.response || "PulseIt could not interpret the sentiment.";

    // Dynamically determine sentiment class
    let className = 'score-neutral';
    if (/bullish/i.test(response)) className = 'score-bullish';
    else if (/bearish/i.test(response)) className = 'score-bearish';

    output.innerHTML = `<p class="radar-section ${className}">📣 PulseIt: ${response}</p>`;
  } catch (err) {
    output.innerHTML = `<p class="radar-section score-neutral">⚠️ PulseIt error: ${err.message}</p>`;
  }
}

async function fetchPrices() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
    const data = await res.json();
    document.getElementById('btc-price').textContent = `$${data.bitcoin.usd.toLocaleString()}`;
    document.getElementById('eth-price').textContent = `$${data.ethereum.usd.toLocaleString()}`;
    document.getElementById('sol-price').textContent = `$${data.solana.usd.toLocaleString()}`;
  } catch (err) {
    console.error('Price fetch error:', err);
  }
}

fetchPrices();
setInterval(fetchPrices, 30000);

function connectSolana() {
  alert("⚠️ Solana Pay integration coming soon. Contact Crimzn directly to confirm payment.");
}




