[Blet questionCount = 0;

async function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;

  questionCount++;
  document.getElementById('chat-box').innerHTML = `<p class="user">🟠 You: ${message}</p>`;
  input.value = ''; // Clear after send

  if (questionCount > 3) {
    document.getElementById('paywall').style.display = 'block';
    return;
  }

  try {
    const res = await fetch('https://crypto-consult.onrender.com/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: message })
    });

    const data = await res.json();
    const botReply = data.response || "❌ CrimznBot couldn't process that.";
    document.getElementById('chat-box').innerHTML = `<p class="bot">🟢 CrimznBot: ${botReply}</p>`;
  } catch (err) {
    document.getElementById('chat-box').innerHTML = `<p class="bot">❌ CrimznBot error: ${err.message}</p>`;
  }
}

async function analyzePulse() {
  const input = document.getElementById('pulse-input');
  const topic = input.value.trim();
  const output = document.getElementById('pulse-output');
  input.value = ''; // Clear after analyze

  if (!topic) return;

  try {
    const res = await fetch('/api/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: topic })
    });

    const data = await res.json();
    const response = data.response || "❌ PulseIt could not determine sentiment.";
    let className = 'score-neutral';

    if (response.includes('Bullish')) className = 'score-bullish';
    else if (response.includes('Bearish')) className = 'score-bearish';

    output.innerHTML = `<p class="radar-section ${className}">🧠 PulseIt: ${response}</p>`;
  } catch (err) {
    output.innerHTML = `<p class="radar-section score-neutral">❌ PulseIt error: ${err.message}</p>`;
  }
}

// --- Live Crypto Prices ---
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

// --- Solana Wallet Connect / Disconnect ---
let wallet = null;

async function connectWallet() {
  try {
    const provider = window.solana;
    if (!provider || !provider.isPhantom) {
      alert("Phantom Wallet not found. Please install it.");
      return;
    }

    const resp = await provider.connect();
    wallet = resp.publicKey.toString();
    alert(`✅ Connected wallet: ${wallet}`);
    document.getElementById("connect-button").style.display = "none";
    document.getElementById("disconnect-button").style.display = "inline-block";
  } catch (err) {
    console.error("Wallet connect error:", err);
    alert("❌ Failed to connect wallet.");
  }
}

function disconnectWallet() {
  if (window.solana && window.solana.disconnect) {
    window.solana.disconnect();
    alert("👋 Wallet disconnected.");
    wallet = null;
    document.getElementById("connect-button").style.display = "inline-block";
    document.getElementById("disconnect-button").style.display = "none";
  }
}
function connectSolana() {
  alert('🪙 Solana Pay: 0.25 SOL required. This will open in your wallet.');
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("submit-button").addEventListener("click", sendMessage);
  document.getElementById("pulse-button").addEventListener("click", analyzePulse);
  document.getElementById("connect-button").addEventListener("click", connectWallet);
  document.getElementById("disconnect-button").addEventListener("click", disconnectWallet);
  document.getElementById("solana-pay-button").addEventListener("click", connectSolana);
  
  fetchPrices();
  setInterval(fetchPrices, 30000);
});
