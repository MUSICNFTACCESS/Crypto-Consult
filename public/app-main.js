// app-main.js – CrimznBot Full Logic + Wallet Connect + Disconnect + PulseIt

document.addEventListener("DOMContentLoaded", () => {
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let maxFreeQuestions = 3;
  let hasPaid = localStorage.getItem("hasPaid") === "true";
  let paywallShown = false;

  const responseBox = document.getElementById("response-box");
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");

  async function connectWallet() {
    const provider = window?.phantom?.solana;
    if (!provider?.isPhantom) {
      alert("🛑 Phantom Wallet not found. Please install it.");
      return;
    }

    try {
      const resp = await provider.connect();
      const wallet = resp.publicKey.toString();
      window.connectedWallet = wallet;
      document.getElementById("wallet-status").innerHTML =
        `🔗 ${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
      connectBtn.classList.add("hidden"); // ✅ hide connect
      disconnectBtn.classList.remove("hidden"); // ✅ show disconnect
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
    }
  }

  function disconnectWallet() {
    window.connectedWallet = null;
    document.getElementById("wallet-status").innerHTML = "";
    connectBtn.classList.remove("hidden"); // ✅ show connect
    disconnectBtn.classList.add("hidden"); // ✅ hide disconnect
  }

  async function askCrimznBot() {
    const input = document.getElementById("prompt");
    const prompt = input.value.trim();
    if (!prompt) return;

    if (!hasPaid) {
      questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
      if (questionCount >= maxFreeQuestions) {
        if (!paywallShown) {
          const paywall = document.getElementById("paywall");
          if (paywall) paywall.style.display = "block";
          paywallShown = true;
        }
        return;
      }
    }

    responseBox.innerHTML = `<span class="response">🟡 Thinking...</span>`;

    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: window.connectedWallet })
      });
      const data = await res.json();

      if (
        data.response.includes("🔒") &&
        !hasPaid &&
        questionCount >= maxFreeQuestions
      ) {
        const paywall = document.getElementById("paywall");
        if (paywall) paywall.style.display = "block";
        paywallShown = true;
        return;
      }

      questionCount++;
      localStorage.setItem("questionCount", questionCount);
      input.value = "";
      responseBox.innerHTML = `<span class="response" style="color: limegreen;">${data.response}</span>`;
    } catch (err) {
      responseBox.innerHTML = `<span class="response" style="color: red;">❌ Error getting response.</span>`;
    }
  }

  // ✅ PulseIt Analyzer Logic
  async function analyzePulseIt() {
    const input = document.getElementById("pulseit-input").value.trim();
    const resultBox = document.getElementById("pulseit-result");
    resultBox.innerHTML = `🟡 Analyzing...`;

    try {
      const res = await fetch("/api/pulseit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      resultBox.innerHTML = `📊 ${data.sentiment.toUpperCase()} — ${data.explanation}`;
    } catch (err) {
      resultBox.innerHTML = `❌ Error analyzing.`;
    }
  }

  // ✅ Payment Status Check
  async function checkPaymentStatus() {
    if (!window.connectedWallet) return;

    try {
      const res = await fetch(`/api/check-payment?wallet=${window.connectedWallet}`);
      const data = await res.json();
      if (data.hasPaid) {
        document.getElementById("paywall").style.display = "none";
        paywallShown = false;
        hasPaid = true;
        localStorage.setItem("hasPaid", "true");
      }
    } catch (err) {
      console.error("❌ Payment check failed:", err);
    }
  }

  // ✅ Main Button Listeners
  document.getElementById("send-btn").addEventListener("click", async () => {
    if (window.connectedWallet && !hasPaid) {
      await checkPaymentStatus();
    }
    askCrimznBot();
  });

  document.getElementById("analyze-btn").addEventListener("click", analyzePulseIt);
  connectBtn.addEventListener("click", connectWallet);
  disconnectBtn.addEventListener("click", disconnectWallet);

  if (hasPaid) {
    document.getElementById("paywall").style.display = "none";
  }

document.getElementById("solana-pay-btn").addEventListener("click", () => {
  const address = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
  const solanaURL = `https://solana.com/pay?recipient=${address}&amount=0.025&reference=crim_consult&label=CryptoConsult&message=Unlock%20CrimznBot`;

  // Detect if on mobile
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Open Solana Pay directly
    window.open(solanaURL, "_blank");
  } else {
    // Show QR fallback for desktop
    const qrBox = document.getElementById("qr-fallback");
    qrBox.innerHTML = ""; // clear old QR

    const qr = new QRCode(qrBox, {
      text: solanaURL,
      width: 200,
      height: 200,
      colorDark: "#000",
      colorLight: "#fff",
      correctLevel: QRCode.CorrectLevel.H
    });

    qrBox.style.display = "block";
  }
});
