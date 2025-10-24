// ==========================================================
// Crimzn Consult - Guest Mode Ask Handler (Fixed Unlock Logic)
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🧠 Crimzn Consult Guest Mode Handler loaded");

  const askBtn = document.getElementById("askBtn");
  const userInput = document.getElementById("userInput");
  const responseBox = document.getElementById("responseBox");
  const guestBtn = document.getElementById("continueWithoutWalletBtn");
  const guestStatus = document.getElementById("guestStatus");
  let connectedWallet = null;

  // === Guest Mode ===
  function enableGuestMode() {
    let id = localStorage.getItem("wallet");
    if (!id || !id.startsWith("guest-")) {
      id = "guest-" + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem("wallet", id);
    }
    window.connectedWallet = id;
    connectedWallet = id;
    if (!localStorage.getItem("guest_free_qs")) localStorage.setItem("guest_free_qs", "0");
    if (guestStatus) {
      guestStatus.style.display = "block";
      guestStatus.textContent = "👋 Guest Mode Active (no wallet)";
    }
    console.log("✅ Guest mode enabled:", id);
  }

  guestBtn?.addEventListener("click", enableGuestMode);

  // === Ask Button Handler ===
  askBtn.onclick = async () => {
    const prompt = (userInput.value || "").trim();
    if (!prompt) { responseBox.innerText = "⚠️ Enter a question."; return; }

    // Determine which wallet/guest ID to use
    const effWallet = (window.connectedWallet || localStorage.getItem("wallet") || "").trim();
    if (!effWallet) {
      responseBox.innerText = "⚠️ Connect wallet or tap 'Continue without Wallet'.";
      return;
    }

    // Track 3-free limit
    const key = `free_qs:${effWallet}`;
    let used = parseInt(localStorage.getItem(key) || "0", 10);

    // Show unlock button (0.025 SOL)
    const showUnlock = () => {
      if (typeof window.forceShowUnlock === "function") window.forceShowUnlock();
      else {
        let btn = document.getElementById("payNowInline");
        if (!btn) {
          btn = document.createElement("button");
          btn.id = "payNowInline";
          btn.className = "solana-button";
          btn.textContent = "🔓 Unlock with 0.025 SOL";
          btn.onclick = window.startUnlock || (() => alert("Unlock handler missing"));
          document.body.appendChild(btn);
        }
        btn.classList.remove("hidden");
      }
      const s = document.getElementById("unlockStatus");
      if (s) {
        s.style.display = "block";
        s.style.color = "lime";
        s.textContent = "🔓 Unlock available — tap the button below.";
      }
      document.getElementById("payNowInline")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    // If already reached 3 free Qs, stop immediately
    if (used >= 3) {
      responseBox.innerText = "🔓 3 free questions used — please unlock with 0.025 SOL.";
      showUnlock();
      return;
    }

    // Increment usage
    localStorage.setItem(key, String(used + 1));

    // Normal flow
    askBtn.disabled = true;
    responseBox.innerText = "🧠 Thinking…";
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 25000);

    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: effWallet }),
        signal: ac.signal
      });
      clearTimeout(timeout);

      if (res.status === 429) {
        responseBox.innerText = "🔓 3 free questions used — please unlock with 0.025 SOL.";
        showUnlock();
        return;
      }

      const txt = await res.text();
      responseBox.innerText = txt || "⚠️ No reply.";
    } catch (err) {
      console.error("Ask error:", err);
      responseBox.innerText = "❌ Error getting answer.";
      // Roll back one question if failed
      const cur = Math.max(0, parseInt(localStorage.getItem(key) || "1", 10) - 1);
      localStorage.setItem(key, String(cur));
    } finally {
      askBtn.disabled = false;
      userInput.value = "";
    }
  };

  console.log("✅ Guest + Ask handler ready");
});
