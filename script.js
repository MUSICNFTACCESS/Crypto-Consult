let questionCount = 0;
let walletAddress = null;

async function sendMessage() {
  const input = document.getElementById("user-input");
  const responseBox = document.getElementById("response");
  const question = input.value.trim();
  input.value = "";

  // Clear previous response
  responseBox.innerHTML = "";

  if (!question) return;

  if (questionCount >= 3) {
    document.getElementById("paywall").classList.remove("hidden");
    return;
  }

  responseBox.classList.remove("hidden");
  responseBox.innerHTML = `<p class="user-question"><strong>You:</strong> ${question}</p>`;

  try {
    const res = await fetch("https://crypto-consult.onrender.com/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    responseBox.innerHTML += `<p class="crimzn-response"><strong>CrimznBot:</strong> ${data.answer}</p>`;
    questionCount++;
  } catch (err) {
    responseBox.innerHTML += `<p style="color: red;">⚠️ Error getting response.</p>`;
  }

  responseBox.scrollTop = responseBox.scrollHeight;
}

function analyzeSentiment() {
  const input = document.getElementById("sentimentInput").value.toLowerCase();
  const output = document.getElementById("pulseOutput");

  // Clear old pulse result
  output.innerHTML = "";

  let sentiment = "Neutral 🟨";
  if (
    input.includes("war") ||
    input.includes("regulation") ||
    input.includes("hacked") ||
    input.includes("scam") ||
    input.includes("dump")
  ) {
    sentiment = "Bearish 🟥";
  } else if (
    input.includes("etf") ||
    input.includes("adoption") ||
    input.includes("bullish") ||
    input.includes("pump") ||
    input.includes("moon") ||
    input.includes("halving") ||
    input.includes("interest rate cut")
  ) {
    sentiment = "Bullish 🟩";
  }

  output.textContent = `PulseIt: ${sentiment}`;
}

async function fetchPrices() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
    const data = await res.json();
    document.getElementById("price-btc").textContent = `BTC: $${data.bitcoin.usd.toLocaleString()}`;
    document.getElementById("price-eth").textContent = `ETH: $${data.ethereum.usd.toLocaleString()}`;
    document.getElementById("price-sol").textContent = `SOL: $${data.solana.usd.toLocaleString()}`;
  } catch (e) {
    console.error("Price fetch failed:", e);
  }
}

async function connectWallet() {
  try {
    const provider = window.solana;
    if (!provider || !provider.isPhantom) {
      alert("Phantom Wallet not found. Please install Phantom.");
      return;
    }

    const resp = await provider.connect();
    walletAddress = resp.publicKey.toString();

    document.getElementById("wallet-display").textContent = `👻 ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
    document.getElementById("wallet-controls").innerHTML = `<button class="solana-button" onclick="disconnectWallet()">Disconnect</button>`;
  } catch (err) {
    console.error("Wallet connection error:", err);
  }
}

function disconnectWallet() {
  walletAddress = null;
  document.getElementById("wallet-display").textContent = "";
  document.getElementById("wallet-controls").innerHTML = `<button class="solana-button" onclick="connectWallet()">Connect Wallet</button>`;
}

window.onload = fetchPrices;
