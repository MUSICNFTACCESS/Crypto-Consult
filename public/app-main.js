document.addEventListener("DOMContentLoaded", () => {
  // ✅ Local state from storage
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let hasPaid = localStorage.getItem("hasPaid") === "true";

  // ✅ DOM elements
  const responseBox = document.getElementById("response-box");
  const connectBtn = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");

  // ✅ Connect Phantom Wallet
  async function connectWallet() {
    try {
      const provider = window?.phantom?.solana;
      if (!provider?.isPhantom) return alert("Phantom not detected. Please install Phantom Wallet.");
      const res = await provider.connect();
      const wallet = res.publicKey.toString();
window.connectedWallet = wallet;
localStorage.setItem("connectedWallet", wallet);

// ✅ Crimzn unlimited bypass
const CRIMZN_WALLET = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
if (wallet === CRIMZN_WALLET) {
  hasPaid = true;
  localStorage.setItem("hasPaid", "true");
  localStorage.setItem("questionCount", "0");
}
      document.getElementById("wallet-status").innerHTML = `🔒 Connected: ${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
      connectBtn.style.display = "none";
      disconnectBtn.style.display = "inline-block";
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
    }
  }

  // ✅ Disconnect
  function disconnectWallet() {
    window.connectedWallet = null;
    localStorage.setItem("hasPaid", "false");
    document.getElementById("wallet-status").innerHTML = "";
    connectBtn.style.display = "inline-block";
    disconnectBtn.style.display = "none";
  }

  // ✅ Ask CrimznBot
  async function askCrimznBot() {
    const input = document.getElementById("prompt");
    const prompt = input.value.trim();
    if (!prompt) return;

    if (!hasPaid && questionCount >= 3) {
      const paywall = document.getElementById("paywall");
      if (paywall) {
        paywall.style.display = "block";
        paywall.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    responseBox.innerHTML = `<span class="response">🟡 Thinking...</span>`;

    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: window.connectedWallet })
      });

      const data = await res.json();

      if (data.response.includes("hit your 3-question limit")) {
        localStorage.setItem("hasPaid", "false");
        const paywall = document.getElementById("paywall");
        paywall.style.display = "block";
        paywall.scrollIntoView({ behavior: "smooth" });
      }

      questionCount++;
      localStorage.setItem("questionCount", questionCount);
      responseBox.innerHTML = `<span class="response" style="color: limegreen;">${data.response}</span>`;
    } catch (err) {
      console.error("❌ CrimznBot error:", err);
      responseBox.innerHTML = `<span class="response" style="color: red;">❌ Bot error. Try again.</span>`;
    }
  }

  // ✅ Check Payment from Backend
  async function checkPaymentStatus() {
    try {
      const res = await fetch(`/api/check-payment?wallet=${window.connectedWallet}`);
      const data = await res.json();
      if (data.hasPaid) {
        hasPaid = true;
        localStorage.setItem("hasPaid", "true");
        document.getElementById("paywall").style.display = "none";
      }
    } catch (err) {
      console.error("❌ Payment status check failed:", err);
    }
  }

  // ✅ Event Listeners
  connectBtn?.addEventListener("click", async () => {
    await connectWallet();
    await checkPaymentStatus();
  });

  disconnectBtn?.addEventListener("click", disconnectWallet);

  const askBtn = document.getElementById("askCrimznBotBtn");
  askBtn?.addEventListener("click", askCrimznBot);

  // 🆕 Solana Pay Button Handler with Safe Link (fixes /undefined error)
  const solanaPayBtn = document.getElementById("solanaPayBtn");
  if (solanaPayBtn) {
    solanaPayBtn.addEventListener("click", async () => {
      try {
        // 🆕 Prevent undefined recipient
        const recipientAddress = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
        if (!recipientAddress) throw new Error("Recipient wallet is missing.");

        const recipient = new solanaWeb3.PublicKey(recipientAddress);
        const amount = 0.025;

        // 🆕 Construct Solana Pay URL safely
        const url = new URL("solana:" + recipient.toString());
        url.searchParams.append("amount", amount.toString());
        url.searchParams.append("label", "CryptoConsult Payment");
        url.searchParams.append("message", "Thanks for supporting Crimzn");

        // 🆕 Extra validation before redirect
        if (!url || !url.toString().startsWith("solana:")) throw new Error("Solana Pay link invalid");

        const isPhantom = window?.phantom?.solana?.isPhantom;
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

        if (isPhantom && isMobile) {
          // ✅ Redirect on mobile Phantom
          window.location.href = url.toString();
        } else {
          // 🆕 QR Code fallback (desktop)
          const qrCodeImg = document.getElementById("qrCodeImg");
          if (qrCodeImg) {
            qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url.toString())}`;
            qrCodeImg.style.display = "block";
            qrCodeImg.scrollIntoView({ behavior: "smooth" });
          } else {
            alert("Scan this payment using your Solana wallet:\n" + url.toString());
          }
        }
      } catch (err) {
        console.error("❌ Solana Pay failed:", err);
        alert("Solana Pay error. Please try again.");
      }
    });
  }
});
