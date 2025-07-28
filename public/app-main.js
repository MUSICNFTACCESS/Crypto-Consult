document.addEventListener("DOMContentLoaded", () => {
  // 📊 Load question count and unlock state
  let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
  let hasPaid = localStorage.getItem("hasPaid") === "true";
  let connectedWallet = null;

  // 🎯 DOM Elements
  const responseBox = document.getElementById("response-box");
  const walletBtn = document.getElementById("walletToggleBtn");
  const solanaPayBtn = document.getElementById("solana-pay-btn");
  const askBtn = document.getElementById("askCrimznBtn");
  const paywall = document.getElementById("paywall"); // 🔓 Paywall DOM reference ✅ SINGLE
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const walletStatus = document.getElementById("walletStatus");
  const priceBTC = document.getElementById("btc-price");
  const priceETH = document.getElementById("eth-price");
  const priceSOL = document.getElementById("sol-price");
  const pulseBtn = document.getElementById("pulseBtn");
  const pulseInput = document.getElementById("pulseInput");
  const pulseBox = document.getElementById("pulseBox");
  const promptInput = document.getElementById("promptInput"); // ✅ FIX

  // 🧠 Toggle wallet button visibility on page load
  if (window.solana?.isConnected) {
    walletBtn.innerText = "🔌 Disconnect Wallet";
  } else {
    walletBtn.innerText = "🔑 Connect Wallet";
  }

  // 🧱 Exit if DOM missing
  if (!responseBox || !walletBtn || !solanaPayBtn || !askBtn || !pulseInput || !pulseBox || !walletStatus || !promptInput) {
    console.error("❌ Missing DOM elements — aborting script execution.");
    return;
  }

  // 💳 Question Paywall
  if (questionCount >= 3 && !hasPaid) {
    promptInput.disabled = true;
    askBtn.disabled = true;
    paywall.style.display = "block";
  }

  // 🔗 Connect Wallet
  async function connectWallet() {
    if (!window.solana || !window.solana.isPhantom) {
      alert("Phantom Wallet not detected. Please install Phantom to continue.");
      return;
    }

    const resp = await window.solana.connect();
    connectedWallet = resp.publicKey.toString();
    walletStatus.innerHTML = `🔓 Connected: ${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`;
    walletBtn.innerText = "🔌 Disconnect Wallet";

    // ✅ Unlock check
    await checkSolanaUnlock(connectedWallet);
    await loadUserProfile(connectedWallet);
  }

  // 🔌 Disconnect Wallet
  async function disconnectWallet() {
    connectedWallet = null;
    questionCount = 0;
    localStorage.removeItem("questionCount");
    localStorage.removeItem("hasPaid");
    walletStatus.innerHTML = "🔒 Wallet disconnected.";
    walletBtn.innerText = "🔑 Connect Wallet";
  }
});

  // 🔁 Toggle logic
  walletBtn.addEventListener("click", async () => {
    if (!connectedWallet) {
      await connectWallet();
    } else {
      await disconnectWallet();
    }
  });

  // 💾 Save Firebase Profile
  async function saveProfileWithSignature(walletAddress) {
    const name = prompt("Enter a display name for your profile (optional):") || "";
    const email = prompt("Enter your email for updates or rewards (optional):") || "";
    const message = `Save my profile on CryptoConsult: ${walletAddress}`;
    const encoded = new TextEncoder().encode(message);
    const signed = await window.solana.signMessage(encoded, "utf8");

    try {
      const res = await fetch("/api/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: walletAddress, email, name, signature: signed.signature }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Profile saved successfully.");
        saveProfileBtn.style.display = "none";
      } else {
        alert("❌ Failed to save profile.");
      }
    } catch (err) {
      alert("❌ Signature required to save your profile.");
      console.error(err);
    }
  }

  // 📥 Load Greeting from Firestore
  async function loadUserProfile(pubkey) {
    try {
      const res = await fetch(`/api/profile/${pubkey}`);
      const json = await res.json();
      document.getElementById("greeting").innerHTML =
        `<strong>CryptoConsult</strong> → the only AI that understands your inner degen. Let's get it 🔥<br>Welcome back, <b>${json.greeting}</b>`;
    } catch (err) {
      console.error("❌ Failed to load saved profile.");
    }
  }

  // 🔓 Solana Pay Unlock Check
  async function checkSolanaUnlock(pubkey) {
    try {
      const res = await fetch(`/api/check-unlock?wallet=${pubkey}`);
      const data = await res.json();
      if (data?.unlocked === true || localStorage.getItem("hasPaid") === "true") {
        localStorage.setItem("hasPaid", "true");
        promptInput.disabled = false;
        askBtn.disabled = false;
        paywall.style.display = "none";
        console.log("✅ Wallet has unlocked. CrimznBot is free to use.");
      } else {
        console.log("🔒 Wallet has not unlocked. CrimznBot yet to be paid.");
      }
    } catch (e) {
      console.error("❌ Unlock check failed:", e);
    }
  }

  // 💸 Fetch Live Prices
  async function fetchPricesForCrimznBot() {
    try {
      const res = await fetch("/api/prices");
      const data = await res.json();
      priceBTC.innerText = `$${data.bitcoin.usd}`;
      priceETH.innerText = `$${data.ethereum.usd}`;
      priceSOL.innerText = `$${data.solana.usd}`;
    } catch (e) {
      console.error("❌ Failed to update prices:", e);
    }
  }

  fetchPricesForCrimznBot();

  // 🤖 Ask CrimznBot
  askBtn.addEventListener("click", async () => {
    responseBox.innerText = "🤖 CrimznBot is thinking...";
    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptInput.value, wallet: connectedWallet }),
      });
      const data = await res.json();
      responseBox.innerHTML = `<span style="color: lime;">🧠 ${data.response}</span>`;
      questionCount++;
      localStorage.setItem("questionCount", questionCount);
    } catch (err) {
      responseBox.innerHTML = `<span style="color: red;">❌ CrimznBot Error: ${err.message}</span>`;
    }
  });

  // 💥 PulseIt: Sentiment Analyzer
  pulseBtn.addEventListener("click", async () => {
    const topic = pulseInput.value.trim();
    if (!topic) return;

    pulseBox.innerHTML = "📊 Analyzing sentiment...";
    try {
      const res = await fetch(`/api/sentiment?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      pulseBox.innerHTML = `📉 Sentiment Score: ${data.score}<br>📝 Summary: ${data.summary}`;
    } catch (err) {
      console.error("❌ PulseIt Error:", err);
      pulseBox.innerHTML = "❌ Failed to fetch sentiment.";
    }
  });

  // 🤖 Ask CrimznBot
  askBtn.addEventListener("click", async () => {
    responseBox.innerText = "🤖 CrimznBot is thinking...";
    try {
      const res = await fetch("/api/crimznbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptInput.value, wallet: connectedWallet }),
      });
      const data = await res.json();
      responseBox.innerHTML = `<span style="color: lime;">🧠 ${data.response}</span>`;
      questionCount++;
      localStorage.setItem("questionCount", questionCount);
    } catch (err) {
      responseBox.innerHTML = `<span style="color: red;">❌ CrimznBot Error: ${err.message}</span>`;
    }
  });

  // 💥 PulseIt: Sentiment Analyzer
  pulseBtn.addEventListener("click", async () => {
    const topic = pulseInput.value.trim();
    if (!topic) return;

    pulseBox.innerHTML = "📊 Analyzing sentiment...";
    try {
      const res = await fetch(`/api/sentiment?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      pulseBox.innerHTML = `📉 Sentiment Score: ${data.score}<br>📝 Summary: ${data.summary}`;
    } catch (err) {
      console.error("❌ PulseIt Error:", err);
      pulseBox.innerHTML = "❌ Failed to fetch sentiment.";
    }
  });

  // 🧾 Force version banner
  document.getElementById("script-cache-bust").innerText = "Script cache-bust: crimznJuly26vFinal";
});
