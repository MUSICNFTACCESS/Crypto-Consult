console.log("🧠 Crimzn Consult v=crimznAug08v1 loaded", new Date().toISOString());

// ✅ Crimzn Consult - app-main.js (Aug 8, 2025)
// Fixes: PulseIt path, stale price badge, debounce buttons, Enter-to-submit, newer Solana blockhash

document.addEventListener("DOMContentLoaded", async () => {
  const connectBtn    = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  const saveBtn       = document.getElementById("saveProfileBtn");
  const askBtn        = document.getElementById("askBtn");
  const pulseBtn      = document.getElementById("pulseBtn");
  const solanaPayBtn  = document.getElementById("solana-pay-btn");

  const nameInput   = document.getElementById("name");
  const emailInput  = document.getElementById("email");
  const userInput   = document.getElementById("user-input");
  const responseBox = document.getElementById("response-box");
  const pulseInput  = document.getElementById("pulseInput");
  const pulseResult = document.getElementById("pulseResult");
  const walletStatus= document.getElementById("walletStatus");

  let connectedWallet = null;

  // ✅ Unlock CrimznBot
  if (solanaPayBtn) {
    solanaPayBtn.onclick = async () => {
      if (!connectedWallet) return alert("⚠️ Connect your wallet first.");

      try {
        const connection = new solanaWeb3.Connection(
          solanaWeb3.clusterApiUrl("mainnet-beta")
        );
        const sender   = new solanaWeb3.PublicKey(connectedWallet);
        const receiver = new solanaWeb3.PublicKey("Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF");

        const transaction = new solanaWeb3.Transaction().add(
          solanaWeb3.SystemProgram.transfer({
            fromPubkey: sender,
            toPubkey: receiver,
            lamports: 25000000,
          })
        );
        transaction.feePayer = sender;

        // ✅ modern blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        const signed    = await window.solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(signature);

        alert("✅ CrimznBot unlocked!");
        localStorage.setItem("hasPaid", "true");
        solanaPayBtn.classList.add("hidden");
        const paywall = document.getElementById("paywall");
        if (paywall) paywall.classList.add("hidden");
      } catch (err) {
        console.error("❌ Unlock failed:", err);
        alert("Unlock failed — transaction not signed/confirmed. Retry or check Phantom.");
      }
    };
  }

  // ✅ Save Profile
  if (saveBtn) {
    saveBtn.onclick = async () => {
      if (!connectedWallet) return alert("⚠️ Connect your wallet first.");

      const profile = {
        wallet: connectedWallet,
        name:  (nameInput?.value || "Anonymous"),
        email: (emailInput?.value || "not provided"),
      };

      try {
        const res = await fetch("/save-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
        const result = await res.text();
        alert(result);
      } catch {
        alert("❌ Failed to save profile.");
      }
    };
  }

  // Hide paywall if already paid
  if (localStorage.getItem("hasPaid") === "true") {
    document.getElementById("paywall")?.classList.add("hidden");
    solanaPayBtn?.classList.add("hidden");
  }

  // ✅ Wallet Connect
  if (window.solana && window.solana.isPhantom) {
    if (connectBtn) {
      connectBtn.onclick = async () => {
        try {
          const resp = await window.solana.connect();
          connectedWallet = resp.publicKey.toString();
          localStorage.setItem("wallet", connectedWallet);
          if (walletStatus) walletStatus.innerText = `🔌 Connected: ${connectedWallet.slice(0, 4)}...`;
          connectBtn.classList.add("hidden");
          disconnectBtn?.classList.remove("hidden");
        } catch (e) {
          alert("❌ Wallet connection failed.");
        }
      };
    }

    if (disconnectBtn) {
      disconnectBtn.onclick = () => {
        connectedWallet = null;
        localStorage.removeItem("wallet");
        if (walletStatus) walletStatus.innerText = "🔌 Not connected";
        connectBtn?.classList.remove("hidden");
        disconnectBtn.classList.add("hidden");
      };
    }

    const savedWallet = localStorage.getItem("wallet");
    if (savedWallet) {
      try {
        const resp = await window.solana.connect({ onlyIfTrusted: true });
        connectedWallet = resp.publicKey.toString();
        if (walletStatus) walletStatus.innerText = `🔌 Connected: ${connectedWallet.slice(0, 4)}...`;
        connectBtn?.classList.add("hidden");
        disconnectBtn?.classList.remove("hidden");
      } catch {
        console.warn("Auto-connect failed.");
      }
    }
  } else {
    alert("👻 Phantom Wallet not found. Please install it.");
  }

  // ✅ Ask CrimznBot (debounced + Enter-to-submit)
  if (askBtn && userInput && responseBox) {
    userInput.addEventListener("keydown", e => { if (e.key === "Enter") askBtn.click(); });

    askBtn.onclick = async () => {
      const prompt = userInput.value.trim();
      const hasPaid = localStorage.getItem("hasPaid") === "true";
      if (!prompt || !connectedWallet) {
        responseBox.innerText = "⚠️ Enter a question and connect wallet.";
        return;
      }

      askBtn.disabled = true;
      try {
        const res = await fetch("/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, wallet: connectedWallet, hasPaid }),
        });

        const answer = await res.text();
        responseBox.innerText = answer;

        // Show paywall when free tier is exhausted
        if (typeof answer === "string" && answer.includes("3 free questions used")) {
          document.getElementById("paywall")?.classList.remove("hidden");
          document.getElementById("solana-pay-btn")?.classList.remove("hidden");
        }
      } catch {
        responseBox.innerText = "🧠 CrimznBot: temporary backend hiccup — try again in a moment.";
      } finally {
        askBtn.disabled = false;
        userInput.value = "";
        responseBox.scrollIntoView({ behavior: "smooth" });
      }
    };
  }

  // ✅ PulseIt Sentiment (debounced + Enter-to-submit)
  if (pulseBtn && pulseInput && pulseResult) {
    pulseInput.addEventListener("keydown", e => { if (e.key === "Enter") pulseBtn.click(); });

    pulseBtn.onclick = async () => {
      const input = pulseInput.value.trim();
      if (!input) return;

      pulseBtn.disabled = true;
      pulseResult.innerText = "🧠 Analyzing...";
      try {
        const res = await fetch("/pulse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input }),
        });

        const json = await res.json(); // {vibe, emoji, explanation, model}
        pulseResult.innerText = `${json.emoji || "⚪"} ${json.vibe || "Neutral"} — ${json.explanation || ""}`;
      } catch (e) {
        console.error("PulseIt error:", e);
        pulseResult.innerText = "❌ Error analyzing sentiment.";
      } finally {
        pulseBtn.disabled = false;
        pulseInput.value = "";
        pulseResult.scrollIntoView({ behavior: "smooth" });
      }
    };
  }

  // 🪟 Modal Open/Close Logic
  const openModalBtn  = document.getElementById("openProfileModal");
  const closeModalBtn = document.getElementById("closeProfileModal");
  const modal         = document.getElementById("profileModal");

  if (openModalBtn && closeModalBtn && modal) {
    openModalBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));

    // click outside to close
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

    // ESC to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) modal.classList.add("hidden");
    });
  }

  // 📈 Load Live Prices (with stale badge support)
  async function loadPrices() {
    try {
      const res  = await fetch("/livePrices");
      const data = await res.json();

      const fmt = v => (typeof v === "number" ? `$${v.toLocaleString()}` : "N/A");

      const btcEl = document.getElementById("btcPrice");
      const ethEl = document.getElementById("ethPrice");
      const solEl = document.getElementById("solPrice");

      if (btcEl) btcEl.innerText = fmt(data?.bitcoin?.usd);
      if (ethEl) ethEl.innerText = fmt(data?.ethereum?.usd);
      if (solEl) solEl.innerText = fmt(data?.solana?.usd);

      // Toggle '(stale)' badge when server returns cached data
      const staleEl = document.getElementById("price-stale");
      if (staleEl) staleEl.style.display = data && data._stale ? "inline" : "none";
    } catch (err) {
      console.warn("⚠️ Failed to load prices (CoinGecko may be rate limiting).", err);
      ["btcPrice", "ethPrice", "solPrice"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = "N/A";
      });
      const staleEl = document.getElementById("price-stale");
      if (staleEl) staleEl.style.display = "inline";
    }
  }

  loadPrices(); // 🚀 Trigger on page load
  // setInterval(loadPrices, 60000); // ⏱️ Optional: refresh every 60s
});
