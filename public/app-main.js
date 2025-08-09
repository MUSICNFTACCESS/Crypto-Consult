console.log("🧠 Crimzn Consult v=crimznAug08v5 loaded", new Date().toISOString());

// ✅ Crimzn Consult - app-main.js (Aug 8, 2025)
// Fixes: PulseIt path, stale price badge, debounce buttons, Enter-to-submit, newer Solana blockhash

document.addEventListener("DOMContentLoaded", async () => {
  const connectBtn    = document.getElementById("connectWalletBtn");
  const disconnectBtn = document.getElementById("disconnectWalletBtn");
  const saveBtn       = document.getElementById("saveProfileBtn");
  const askBtn        = document.getElementById("askBtn");
  const pulseBtn      = document.getElementById("pulseBtn");
  const solanaPayBtn  = document.getElementById("solana-pay-btn");

  const nameInput    = document.getElementById("name");
  const emailInput   = document.getElementById("email");
  const userInput    = document.getElementById("user-input");
  const responseBox  = document.getElementById("response-box");
  const pulseInput   = document.getElementById("pulseInput");
  const pulseResult  = document.getElementById("pulseResult");
  const walletStatus = document.getElementById("walletStatus");

  let connectedWallet = null;

// ================= UNLOCK via Phantom deeplink + server verify =================
if (solanaPayBtn) {
  solanaPayBtn.onclick = async () => {
    try {
      // 1) open Phantom send UI
      const receiver = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
      const amountSol = 0.025;

      // we’ll verify against this sender, so make sure we have it
      if (!connectedWallet) {
        try {
          const resp = await (window.phantom?.solana ?? window.solana)?.connect();
          connectedWallet = resp?.publicKey?.toString();
        } catch {
          return alert("Connect your wallet first.");
        }
      }

      const url = new URL(`solana:${receiver}`);
      url.searchParams.set("amount", amountSol.toString());
      url.searchParams.set("label", "CrimznBot Unlock");
      url.searchParams.set("message", "Unlock CrimznBot access");
      window.location.href = url.toString(); // opens Phantom

      // 2) poll backend for confirmation for up to ~90s
      const started = Date.now();
      const poll = async () => {
        const qs = new URLSearchParams({
          sender: connectedWallet,
          receiver,
          amount: (amountSol).toString(),
        });
        const r = await fetch(`/verify-unlock?${qs}`, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (j?.confirmed === true) return true;
        }
        return false;
      };

      const timeoutMs = 90_000, intervalMs = 3000;
      while (Date.now() - started < timeoutMs) {
        // small delay so user can approve in Phantom
        await new Promise(r => setTimeout(r, intervalMs));
        if (await poll()) break;
      }

      // 3) flip UI if confirmed, otherwise nudge
      const ok = await (async () => {
        const qs = new URLSearchParams({
          sender: connectedWallet, receiver, amount: amountSol.toString()
        });
        const r = await fetch(`/verify-unlock?${qs}`, { cache: "no-store" });
        return r.ok && (await r.json())?.confirmed === true;
      })();

      if (!ok) return alert("Still waiting for payment… if you sent it, give it a moment and try again.");

      // success UI
      localStorage.setItem("hasPaid", "true");
      document.getElementById("paywall")?.classList.add("hidden");
      document.getElementById("solana-pay-btn")?.classList.add("hidden");
      const s = document.getElementById("unlockStatus");
      if (s) { s.style.display = "block"; s.style.color = "lime"; s.textContent = "✅ CrimznBot Unlocked!"; }
      alert("✅ CrimznBot unlocked!");
    } catch (e) {
      alert(`Unlock failed — ${e?.message || e}`);
    }
  };
}
// ================= /UNLOCK =================

  // ========================= SAVE PROFILE (unchanged) =========================
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
  // ========================= /SAVE PROFILE =========================

  // ========================= PAYWALL HIDE IF ALREADY PAID (unchanged) =========================
  if (localStorage.getItem("hasPaid") === "true") {
    document.getElementById("paywall")?.classList.add("hidden");
    solanaPayBtn?.classList.add("hidden");
  }
  // ========================= /PAYWALL =========================

  // ========================= WALLET CONNECT/DISCONNECT (unchanged) =========================
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
  // ========================= /WALLET =========================

  // ========================= ASK: CrimznBot (3-free local limiter + faster UX) — UPDATED =========================
  if (askBtn && userInput && responseBox) {
    // Enter to submit
    userInput.addEventListener("keydown", e => { if (e.key === "Enter") askBtn.click(); });

    const FREE_LIMIT = 3;

    function showPaywall() {
      document.getElementById("paywall")?.classList.remove("hidden");
      document.getElementById("solana-pay-btn")?.classList.remove("hidden");
    }

    askBtn.onclick = async () => {
      const prompt = userInput.value.trim();
      const hasPaid = localStorage.getItem("hasPaid") === "true";
      const localKey = `askedLocal:${connectedWallet}`;

      if (!prompt || !connectedWallet) {
        responseBox.innerText = "⚠️ Enter a question and connect wallet.";
        return;
      }

      // Local free-question limiter (defense-in-depth vs server restarts)
      let askedLocal = parseInt(localStorage.getItem(localKey) || "0", 10);
      console.log("📊 Free Q count (before):", askedLocal, "Paid:", hasPaid);

      if (!hasPaid && askedLocal >= FREE_LIMIT) {
        responseBox.innerText = "⚠️ 3 free questions used. Unlock CrimznBot with 0.025 SOL.";
        showPaywall();
        return;
      }

      // ✅ PRE-INCREMENT (attempt-based) so the 4th click blocks immediately
      if (!hasPaid) {
        askedLocal = Math.min(FREE_LIMIT, askedLocal + 1);
        localStorage.setItem(localKey, String(askedLocal));
        console.log("➕ askedLocal (pre-send) →", askedLocal);
      }

      // perceived speed & safety timeout
      askBtn.disabled = true;
      responseBox.innerText = "🧠 Thinking…";

      const ac = new AbortController();
      const timeout = setTimeout(() => ac.abort(), 25_000); // abort if it hangs too long

      try {
        const res = await fetch("/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, wallet: connectedWallet }),
          signal: ac.signal
        });
        clearTimeout(timeout);

        const answer = await res.text();
        responseBox.innerText = answer;

        // If backend enforces the limit, show paywall (and stop here)
        if (!hasPaid && typeof answer === "string" && answer.includes("3 free questions used")) {
          showPaywall();
          return;
        }

        // If that was the 3rd free Q, add a gentle nudge
        if (!hasPaid && askedLocal >= FREE_LIMIT) {
          responseBox.insertAdjacentText("beforeend", "\n(Free tier used — next Q requires unlock)");
        }
      } catch (e) {
        if (e.name === "AbortError") {
          responseBox.innerText = "⚠️ Request timed out. Try again.";
        } else {
          console.error("Ask CrimznBot error:", e);
          responseBox.innerText = "🧠 CrimznBot: temporary backend hiccup — try again in a moment.";
        }
        // 👇 Roll back the pre-increment so errors don't consume a free attempt
        if (!hasPaid) {
          const val = Math.max(0, parseInt(localStorage.getItem(localKey) || "1", 10) - 1);
          localStorage.setItem(localKey, String(val));
        }
      } finally {
        askBtn.disabled = false;
        userInput.value = "";
        responseBox.scrollIntoView({ behavior: "smooth" });
      }
    }; // UPDATE: end askBtn.onclick — this was missing before
  }   // UPDATE: end ASK block — this was missing before
  // ========================= /ASK =========================

  // ========================= PULSEIT SENTIMENT (unchanged) =========================
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
  // ========================= /PULSEIT =========================

  // ========================= MODAL OPEN/CLOSE (unchanged) =========================
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
  // ========================= /MODAL =========================

  // ========================= LIVE PRICES (stale badge) — unchanged from your latest =========================
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
  // ========================= /PRICES =========================
}); // UPDATE: end DOMContentLoaded — this was missing before
