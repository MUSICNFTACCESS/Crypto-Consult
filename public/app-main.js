console.log("🧠 Crimzn Consult v=crimznAug21v2 loaded", new Date().toString());

// ✅ Crimzn Consult - app-main.js (Aug 10, 2025)
// Fixes: PulseIt path, stale price badge, debounce buttons, Enter-to-submit, newer Solana blockhash, improved paywall handling

document.addEventListener("DOMContentLoaded", async () => {
  try {
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

// --- verify paid: poll backend quietly for up to 20s ---
async function verifyPaidLoop(wallet) {
  const start = Date.now();
  while (Date.now() - start < 20000) { // 20s
    try {
      const r = await fetch(`/verify-paid?wallet=${encodeURIComponent(wallet)}`);
      if (r.ok) {
        const j = await r.json();
        if (j?.hasPaid === true) return true;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 1500));
  }
  return false;
}

// ================= UNLOCK via Phantom deeplink + server verify =================
const startUnlock = async () => {
  try {
    const receiver = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
    const amountSol = 0.025;

    // Ensure wallet is connected (inner try/catch only here)
    if (!connectedWallet) {
      try {
        const resp = await (window.phantom?.solana ?? window.solana)?.connect();
        connectedWallet = resp?.publicKey?.toString();
      } catch (e) {
        return alert("Connect your wallet first.");
      }
    }

    // Open Phantom deep link
    const url = new URL(`solana:${receiver}`);
    url.searchParams.set("amount", amountSol.toString());
    url.searchParams.set("label", "CrimznBot Unlock");
    url.searchParams.set("message", "Unlock CrimznBot access");
    window.location.href = url.toString();

    // UI: start verifying
    if (typeof responseBox !== "undefined" && responseBox) {
      responseBox.innerText = "🔄 Verifying unlock on-chain…";
    }

    // Poll backend for paid status
    const ok = await verifyPaidLoop(connectedWallet);
    if (ok) {
      localStorage.setItem("hasPaid", "true");
      const s = document.getElementById("unlockStatus");
      if (s) {
        s.style.display = "block";
        s.style.color = "lime";
        s.textContent = "✅ CrimznBot Unlocked!";
      }
      if (typeof responseBox !== "undefined" && responseBox) {
        responseBox.innerText = "✅ Unlocked! Ask away.";
      }
    } else {
      if (typeof responseBox !== "undefined" && responseBox) {
        responseBox.innerText = "⚠️ Unlock pending. If it doesn’t clear in a minute, try again.";
      }
    }

  } catch (err) {
    // Outer catch: network/transient issues after deeplink
    console.warn("Unlock flow transient error:", err);
    if (typeof responseBox !== "undefined" && responseBox) {
      responseBox.innerText = "⚠️ Network hiccup during unlock. I’ll keep checking…";
    }
    try {
      const ok2 = await verifyPaidLoop(connectedWallet);
      if (ok2) {
        localStorage.setItem("hasPaid", "true");
        const s = document.getElementById("unlockStatus");
        if (s) {
          s.style.display = "block";
          s.style.color = "lime";
          s.textContent = "✅ CrimznBot Unlocked!";
        }
        if (typeof responseBox !== "undefined" && responseBox) {
          responseBox.innerText = "✅ Unlocked! Ask away.";
        }
      }
    } catch (innerErr) {
      console.error("Verification retry failed:", innerErr);
    }
  }
}; // <-- closes async function startUnlock

// keep the original wiring so the button still triggers startUnlock
solanaPayBtn?.addEventListener("click", startUnlock);
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
        } catch (e) {
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
        } catch (e) {
          console.warn("Auto-connect failed.");
        }
      }
    } else {
      alert("👻 Phantom Wallet not found. Please install it.");
    }
    // ========================= /WALLET =========================



// ========================= ASK: CrimznBot (3-free local limiter + faster UX) =========================
if (askBtn && userInput && responseBox) {
  // Enter to submit
  userInput.addEventListener("keydown", (e) => { if (e.key === "Enter") askBtn.click(); });

  const FREE_LIMIT = 3;

  function injectInlineUnlock() {
    responseBox.innerHTML = `
      <div style="margin-top:8px">
        <button id="payNowInline" class="solana-button">🔓 Unlock with 0.025 SOL</button>
      </div>
    `;
    document.getElementById("payNowInline")?.addEventListener("click", startUnlock);
  }

  askBtn.onclick = async () => {
    const prompt   = userInput.value.trim();
    const hasPaid  = localStorage.getItem("hasPaid") === "true";
    const localKey = `askedLocal:${connectedWallet}`;

    if (!prompt || !connectedWallet) {
      responseBox.innerText = "⚠️ Enter a question and connect wallet.";
      return;
    }

    // Read local count
    let askedLocal = parseInt(localStorage.getItem(localKey) || "0", 10);

    // Hard block immediately at local limit — show only unlock button
    if (!hasPaid && askedLocal >= FREE_LIMIT) {
      injectInlineUnlock();
      return;
    }

    // Pre-increment so the 4th click blocks immediately
    if (!hasPaid) {
      askedLocal = Math.min(FREE_LIMIT, askedLocal + 1);
      localStorage.setItem(localKey, String(askedLocal));
    }

    askBtn.disabled = true;
    responseBox.innerText = "🧠 Thinking…";

    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 25_000);

    try {
      const res = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, wallet: connectedWallet }),
        signal: ac.signal
      });
      clearTimeout(timeout);

      // ✅ Safer server + client paywall handling
      if (res.status === 429) {
        try {
          const json = await res.json();
          if (json?.code === "FREE_LIMIT_REACHED") {
            injectInlineUnlock();
            return;
          }
        } catch {
          // if body wasn't JSON, still show unlock
          injectInlineUnlock();
          return;
        }
        injectInlineUnlock();
        return;
      }

      const answer = await res.text();
      console.log("[ASK] raw server answer:", answer);

      // ✅ Also catch any accidental text mentioning limit
      if (
        !hasPaid &&
        typeof answer === "string" &&
        /\b3\s*free\s*questions?\s*used\b/i.test(answer)
      ) {
        injectInlineUnlock();
        return;
      }

      responseBox.innerText = answer;

      // If this click *used up* the last free question, show unlock now
      if (!hasPaid && askedLocal >= FREE_LIMIT) {
        injectInlineUnlock();
        return;
      }

    } catch (e) {
      console.error("Ask error:", e);
      responseBox.innerText = "❌ Error getting answer.";
      // roll back pre-increment on error so user doesn't lose a free attempt
      if (!hasPaid) {
        const val = Math.max(0, parseInt(localStorage.getItem(localKey) || "1", 10) - 1);
        localStorage.setItem(localKey, String(val));
      }
    } finally {
      askBtn.disabled = false;
      userInput.value = "";
      responseBox.scrollIntoView({ behavior: "smooth" });
    }
  };
}
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

          const json = await res.json();
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

      modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) modal.classList.add("hidden");
      });
    }
    // ========================= /MODAL =========================

    // ========================= LIVE PRICES (unchanged) =========================
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

        const staleEl = document.getElementById("price-stale");
        if (staleEl) staleEl.style.display = data && data._stale ? "inline" : "none";
      } catch (err) {
        console.warn("⚠️ Failed to load prices.", err);
        ["btcPrice", "ethPrice", "solPrice"].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.innerText = "N/A";
        });
        const staleEl = document.getElementById("price-stale");
        if (staleEl) staleEl.style.display = "inline";
      }
    }

    loadPrices();
  } catch (err) {
    console.error("❌ Error in DOMContentLoaded:", err);
  }
});
