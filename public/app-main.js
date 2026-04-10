console.log("🧠 Crimzn Consult v=crimznAug27v1 loaded", new Date().toString());

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

    // ✅ Mobile-safe unlock verification: run when user returns from Phantom
    window.addEventListener("focus", () => { verifyPendingUnlock(); });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) verifyPendingUnlock();
    });

    let connectedWallet = null;

function openInPhantom() {
  const here = window.location.href.split("#")[0];
  const phantomBrowse = "https://phantom.app/ul/browse/" + encodeURIComponent(here);
  window.location.href = phantomBrowse;
}


function showVerifyUnlockUI() {
  const paywall = document.getElementById("paywall");
  const s = document.getElementById("unlockStatus");
  if (s) {
    s.style.display = "block";
    s.style.color = "#ffd54a";
    s.textContent = "🔎 Payment sent? Tap VERIFY to unlock.";
  }

  // Inject a verify button right into the response box area
  if (typeof responseBox !== "undefined" && responseBox) {
    responseBox.innerHTML = `
      <div style="margin-top:10px; line-height:1.4">
        <div style="font-weight:700; margin-bottom:6px">🔎 Verify Unlock</div>
        <div style="opacity:.9; margin-bottom:10px">
          If you paid in Phantom, connect your wallet (if needed) then tap verify.
        </div>
        <button id="verifyUnlockBtn" class="solana-button">✅ VERIFY UNLOCK</button>
      </div>
    `;
    document.getElementById("verifyUnlockBtn")?.addEventListener("click", async () => {
      try {
        // If no wallet yet, try to connect (works in Phantom browser; in Chrome user may need to open in Phantom)
        if (!connectedWallet) {
          try {
            const resp = await (window.phantom?.solana ?? window.solana)?.connect();
            connectedWallet = resp?.publicKey?.toString();
            if (connectedWallet) localStorage.setItem("wallet", connectedWallet);
            if (connectedWallet) localStorage.setItem("pendingWallet", connectedWallet);
          } catch {}
        }
        await verifyPendingUnlock();
      } catch (e) {
        console.warn("Verify unlock click error:", e);
      }
    });
  }
}

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

async function restorePaidAccessIfEligible(wallet) {
  try {
    if (!wallet || String(wallet).startsWith("guest-")) return false;

    const paid = await verifyPaidLoop(wallet);
    if (!paid) return false;

    localStorage.setItem("hasPaid", "true");
    localStorage.setItem("wallet", wallet);

    const paywall = document.getElementById("paywall");
    const payBtn = document.getElementById("solana-pay-btn");
    const sEl = document.getElementById("unlockStatus");

    paywall?.classList.add("hidden");
    payBtn?.classList.add("hidden");

    if (sEl) {
      sEl.style.display = "block";
      sEl.style.color = "lime";
      sEl.textContent = "✅ CrimznBot Unlocked!";
    }

    if (typeof responseBox !== "undefined" && responseBox) {
      responseBox.innerText = "✅ Unlocked! Ask away.";
    }

    return true;
  } catch (e) {
    console.warn("restorePaidAccessIfEligible error:", e);
    return false;
  }
}

// --- verify on return (mobile-safe): if user just paid in Phantom, verify when they come back ---
async function verifyPendingUnlock() {
  try {
    const pending = localStorage.getItem("pendingUnlock") === "true";
    const w = localStorage.getItem("pendingWallet") || localStorage.getItem("wallet") || "";
    if (!pending || !w) return;

    if (typeof responseBox !== "undefined" && responseBox) {
      responseBox.innerText = "🔎 Checking payment…";
    }

    const ok = await verifyPaidLoop(w);
    if (ok) {
      localStorage.setItem("hasPaid", "true");
      localStorage.removeItem("pendingUnlock");
      localStorage.removeItem("pendingWallet");

      const sEl = document.getElementById("unlockStatus");
      if (sEl) {
        sEl.style.display = "block";
        sEl.style.color = "lime";
        sEl.textContent = "✅ CrimznBot Unlocked!";
      }

      // Hide paywall + unlock buttons
      document.getElementById("paywall")?.classList.add("hidden");
      document.getElementById("solana-pay-btn")?.classList.add("hidden");

      if (typeof responseBox !== "undefined" && responseBox) {
        responseBox.innerText = "✅ Unlocked! Ask away.";
      }
    } else {
      // keep pending so it can be checked again
      if (typeof responseBox !== "undefined" && responseBox) {
        responseBox.innerText = "⏳ Payment not confirmed yet. If you just paid, tap Unlock again or wait a moment.";
      }
    }
  } catch (e) {
    console.warn("verifyPendingUnlock error:", e);
  }
}

// ================= UNLOCK via Phantom deeplink + server verify =================
const startUnlock = async () => {
  try {
    const receiver = "Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF";
    const amountSol = 0.01;

    // Ensure wallet is connected (inner try/catch only here)
    if (!connectedWallet) {
      try {
        const resp = await (window.phantom?.solana ?? window.solana)?.connect();
        connectedWallet = resp?.publicKey?.toString();
        localStorage.setItem("wallet", connectedWallet);
        localStorage.setItem("pendingWallet", connectedWallet);

      } catch (e) {
        alert("No wallet detected — use Coinbase Commerce or install a wallet.");
      }
    }

// Unified provider (works in Phantom in-app + normal browsers)
const provider = (window.phantom?.solana ?? window.solana);

// Build params
const label = encodeURIComponent("CrimznBot Unlock");
const message = encodeURIComponent("Unlock CrimznBot access");
const memo = encodeURIComponent("CrimznBot Unlock");
const here = window.location.href.split("#")[0];
const redirect = encodeURIComponent(here);

// Phantom Universal Link (external browsers)
const phantomUL =
  `https://phantom.app/ul/v1/transfer` +
  `?recipient=${encodeURIComponent(receiver)}` +
  `&amount=${encodeURIComponent(amountSol.toString())}` +
  `&label=${label}` +
  `&message=${message}` +
  `&memo=${memo}` +
  `&redirect_link=${redirect}`;

// solana: link (best inside Phantom in-app browser)
const payUrl = new URL(`solana:${receiver}`);
payUrl.searchParams.set("amount", amountSol.toString());
payUrl.searchParams.set("label", "CrimznBot Unlock");
payUrl.searchParams.set("message", "Unlock CrimznBot access");

// Mark pending BEFORE redirect
localStorage.setItem("pendingUnlock", "true");
if (connectedWallet) localStorage.setItem("pendingWallet", connectedWallet);

// Redirect correctly
if (provider?.isPhantom) {
  window.location.href = payUrl.toString();
} else {
  window.location.href = phantomUL;
}
return;


    // ✅ Mobile-safe: mark pending unlock and verify when user returns from Phantom
    localStorage.setItem("pendingUnlock", "true");
    if (connectedWallet) localStorage.setItem("pendingWallet", connectedWallet);

    if (typeof responseBox !== "undefined" && responseBox) {
      responseBox.innerText = "📲 Complete the payment in your wallet, then come back here — I’ll verify automatically.";
    }

  } catch (err) {
    // Outer catch: network/transient issues after deeplink
    console.warn("Unlock flow transient error:", err);
    if (typeof responseBox !== "undefined" && responseBox) {
      responseBox.innerText = "⚠️ Network hiccup. If you just paid, return here and I’ll verify.";
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

    // If user paid in wallet app and returned, allow verify on Chrome
    if (localStorage.getItem("pendingUnlock") === "true") {
      showVerifyUnlockUI();
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
            await restorePaidAccessIfEligible(connectedWallet);
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
          localStorage.setItem("wallet", connectedWallet);
          if (walletStatus) walletStatus.innerText = `🔌 Connected: ${connectedWallet.slice(0, 4)}...`;
          connectBtn?.classList.add("hidden");
          disconnectBtn?.classList.remove("hidden");
          await restorePaidAccessIfEligible(connectedWallet);
        } catch (e) {
          console.warn("Auto-connect failed.");
        }
      }
} else {
  // ✅ Don't block visitors. Wallet is optional for the free trial.
  console.warn("Phantom not detected. Free mode will still work; wallet required only to unlock.");
  if (walletStatus) walletStatus.innerText = "🆓 Free mode (no wallet). Install Phantom to unlock.";
  // ✅ Chrome fallback: open this page inside Phantom browser for full connect + unlock flow
  if (typeof responseBox !== "undefined" && responseBox) {
    responseBox.innerHTML = `
      <div style="margin-top:10px; line-height:1.4">
        <div style="font-weight:700; margin-bottom:6px">🆓 Free mode</div>
        <div style="opacity:.9; margin-bottom:10px">
          To unlock on Chrome, open this page inside Phantom (wallet connect works there).
        </div>
        <button id="openInPhantomBtn" class="solana-button">👻 Open in Phantom</button>
      </div>
    `;
    document.getElementById("openInPhantomBtn")?.addEventListener("click", openInPhantom);
  }

  // Leave the connect button visible if you want, but don't force anything.
}
    // ========================= /WALLET =========================



// ========================= ASK: CrimznBot (3-free local limiter + faster UX) =========================
if (askBtn && userInput && responseBox) {
  // Enter to submit
  userInput.addEventListener("keydown", (e) => { if (e.key === "Enter") askBtn.click(); });

  const FREE_LIMIT = 3;

  function injectInlineUnlock() {
    responseBox.innerHTML = `
  <div style="margin-top:10px; line-height:1.4">
    <div style="font-weight:700; margin-bottom:6px">✅ Free trial used (3/3)</div>
    <div style="opacity:.9; margin-bottom:10px">
      Unlock unlimited CrimznBot Q&A + live prices + premium tools.
    </div>
    <button id="payNowInline" class="solana-button">🔓 Unlock unlimited (0.01 SOL)</button>
    <div style="font-size:12px; opacity:.8; margin-top:8px">
      Wallet connects only for payment verification — no custody, on-chain verified.
    </div>
  </div>
`;
document.getElementById("payNowInline")?.addEventListener("click", startUnlock);
  }

  askBtn.onclick = async () => {
    const prompt   = userInput.value.trim();
    const hasPaid  = localStorage.getItem("hasPaid") === "true";
    // ✅ Wallet optional for free mode
    if (!prompt) {
      responseBox.innerText = "⚠️ Enter a question.";
      return;
    }

    // If no wallet connected, use a guest id for the 3 free questions
    if (!connectedWallet) {
      let id = localStorage.getItem("guestId");
      if (!id) {
        id = "guest-" + Math.random().toString(36).slice(2) + "-" + Date.now();
        localStorage.setItem("guestId", id);
      }
      connectedWallet = id;
      localStorage.setItem("wallet", connectedWallet);
      if (typeof walletStatus !== "undefined" && walletStatus) {
        walletStatus.innerText = "🆓 Free mode (3 questions). Connect wallet to unlock unlimited.";
      }
    }

    const localKey = `askedLocal:${connectedWallet}`;

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

/* === Minimal Guest Mode (independent of Connect button) === */
(() => {
  if (window.__guestModeIndependent) return;
  window.__guestModeIndependent = true;

  function ensureGuestId() {
    let id = localStorage.getItem("guestId");
    if (!id) {
      id = "guest-" + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem("guestId", id);
    }
    return id;
  }

  function enableGuestMode() {
    const id = ensureGuestId();
    // Make the app think “a wallet string” exists so /ask can proceed
    localStorage.setItem("wallet", id);
    localStorage.setItem("hasPaid", "false");
    window.connectedWallet = id;

    // Optional: status line only (does NOT hide connect/disconnect)
    const s = document.getElementById("walletStatus");
    if (s) s.textContent = "👋 Guest Mode Active (no wallet)";
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Wire the existing button if present (no styling or placement changes)
    const btn = document.getElementById("continueWithoutWalletBtn");
    if (btn && !btn.__wiredGuest) {
      btn.__wiredGuest = true;
      btn.addEventListener("click", enableGuestMode);
    }

    // If user already chose guest earlier, expose it so app can send /ask immediately
    const w = localStorage.getItem("wallet") || "";
    if (w.startsWith("guest-")) window.connectedWallet = w;

    // (Optional safety) If server returns 429 on /ask in guest mode, reveal your unlock UI
    const origFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const res = await origFetch(...args);
      try {
        const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
        const isGuest = (localStorage.getItem("wallet") || "").startsWith("guest-");
        if (isGuest && url.includes("/ask") && res.status === 429) {
          if (typeof window.forceShowUnlock === "function") window.forceShowUnlock();
          const s = document.getElementById("unlockStatus");
          if (s) { s.style.display = "block"; s.style.color = "lime";
                  s.textContent = "🔓 Unlock available — tap the button below."; }
        }
      } catch {}
      return res;
    };
  });
})();
