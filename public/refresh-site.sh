cd ~/Crypto-Consult/public && \
cp index.html index.html.bak_final_refresh && \
cp solanamind.html solanamind.html.bak_final_refresh && \
cp swap.html swap.html.bak_final_refresh && \
cp radar.html radar.html.bak_final_refresh && \
cp whitepaper.html whitepaper.html.bak_final_refresh && \
cp faq.html faq.html.bak_final_refresh && \
cp sponsor.html sponsor.html.bak_final_refresh && \
cat <<'EOF' > index.html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CryptoConsult by Crimzn</title>

<link rel="icon" type="image/png" href="brand.png?v=crimznAug27v1" />
<link rel="stylesheet" href="style.css?v=crimznAug27v1" />
<script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.js"></script>
</head>
<body>

<div id="priceBar" style="display:flex;gap:12px;padding:8px 12px;background:#111;color:#0f0;font-family:monospace;flex-wrap:wrap;justify-content:center;">
  <span>BTC: <strong id="btcPrice">--</strong></span>
  <span>ETH: <strong id="ethPrice">--</strong></span>
  <span>SOL: <strong id="solPrice">--</strong></span>
  <span id="price-stale" style="font-size:.8em; opacity:.7; margin-left:.5rem; display:none;">(stale)</span>
</div>

<div style="text-align:center; margin: 20px 0;">
  <img src="brand.png?v=crimznAug27v1"
       alt="CryptoConsult Brand"
       style="width:100px;height:auto;box-shadow:0 0 15px rgba(0,255,170,0.6);border-radius:8px;" />
</div>

<h1>🧠 CryptoConsult by Crimzn</h1>

<div style="max-width:860px;margin:0 auto 24px auto;text-align:center;padding:0 16px;">
  <h2 style="margin-bottom:10px;">Your Crypto Intelligence Terminal</h2>
  <p style="font-size:1.05rem;line-height:1.6;margin-bottom:14px;">
    Ask CryptoConsult for a fast read on BTC, SOL, market news, and crypto setups before you enter.
  </p>
  <p style="color:#00ff99;font-weight:bold;margin-bottom:10px;">
    Find tops. Track whales. Stay ahead.
  </p>

  <div style="background:#111;border:1px solid #333;border-radius:12px;padding:14px 16px;margin:14px auto 18px auto;text-align:left;max-width:680px;">
    <div style="font-weight:bold;margin-bottom:8px;">Try asking:</div>
    <div>• Should I short BTC here?</div>
    <div>• Is SOL breaking down or bouncing?</div>
    <div>• What does this news mean for crypto?</div>
    <div>• Where is the next liquidity sweep?</div>
  </div>

  <p style="font-size:.95rem;opacity:.9;">
    No logins. No friction. Just signal.
  </p>
</div>

<h2>🤖 Ask CrimznBot</h2>
<div style="max-width:820px;margin:0 auto;text-align:center;padding:0 16px 12px 16px;">
  <p style="margin-bottom:10px;">
    Get plain-English crypto answers with live pricing, strategy context, and market-aware reasoning.
  </p>
  <p style="color:#00ffcc;margin-bottom:10px;">
    We help you not get wrecked.
  </p>
</div>

<input id="user-input" type="text" placeholder="e.g. Should I short BTC at 73k?" />
<button id="askBtn" class="solana-button">📤 Ask Now</button>
<button id="continueWithoutWalletBtn" class="solana-button">🆓 Continue Free</button>
<div id="response-box" class="response-box"></div>

<div id="paywall" style="max-width:820px;margin:24px auto 0 auto;text-align:center;padding:0 16px;">
  <h2>🔓 Unlock Unlimited</h2>
  <p>
    Get unlimited CrimznBot access with a one-time payment of <strong>0.01 SOL (early access pricing)</strong>.
  </p>
  <p style="color:#00ffcc;">⚡ One-time unlock. No subscriptions.</p>
  <button id="solana-pay-btn" class="solana-button">🔓 Unlock with Solana Pay</button>
</div>

<div style="text-align:center;margin-top:18px;">
  <button onclick="document.getElementById('toolkit').style.display='block'; this.style.display='none';" class="solana-button">
    🔎 Open Trader Toolkit
  </button>
</div>

<div id="toolkit" style="display:none; margin-top:30px; text-align:center;">

  <div style="max-width:820px;margin:0 auto;text-align:center;padding:0 16px;">
    <h2>🧰 Trader Toolkit</h2>
    <p>Advanced tools for traders, research, and crypto intelligence.</p>
  </div>

  <div style="max-width:820px;margin:28px auto 0 auto;text-align:center;padding:0 16px;">
    <h2>🔓 Wallet & Unlock</h2>
    <p style="margin-bottom:12px;">
      Wallet connection is used only for payment verification and optional feature unlocks.
      No custody. No personal data collection. No off-chain profiles.
    </p>
  </div>

  <button id="connectWalletBtn" class="solana-button">🟣 Connect Wallet</button>
  <button id="disconnectWalletBtn" class="solana-button hidden">❌ Disconnect</button>
  <p id="walletStatus" style="color: lime">🔌 Not connected</p>

  <button id="openProfileModal" class="solana-button">💾 Save My Profile (optional)</button>

  <div id="profileModal" class="modal hidden">
    <div class="modal-content">
      <span id="closeProfileModal" class="close-button">❌</span>
      <h3>Save Profile</h3>
      <input id="name" placeholder="Name (optional)" /><br />
      <input id="email" placeholder="Email (optional)" /><br />
      <button id="saveProfileBtn" class="solana-button">💾 Save to Firebase</button>
    </div>
  </div>

  <div id="unlockStatus" style="text-align:center;margin-top:8px;display:none;">
    🔓 CrimznBot Unlocked
  </div>

  <h2>🧠 PulseIt - Sentiment Analyzer</h2>
  <div style="max-width:820px;margin:0 auto;text-align:center;padding:0 16px 12px 16px;">
    <p>Analyze macro sentiment around ETFs, war, regulation, rates, liquidity, or any crypto topic.</p>
  </div>
  <input id="pulseInput" placeholder="Type a topic like 'ETF' or 'war'" />
  <button id="pulseBtn" class="solana-button">🔍 Analyze</button>
  <div id="pulseResult" class="pulse-result"></div>

  <h2>🔎 Explore More Tools</h2>
  <div style="max-width:820px;margin:0 auto;text-align:center;padding:0 16px 12px 16px;">
    <p>Use wallet intelligence, market-cycle dashboards, swaps, docs, and partner tools.</p>
  </div>

  <a href="/solanamind.html" class="solana-button">
    🧠 SolanaMind Intelligence
    <span style="margin-left:6px;font-size:12px;background:#22c55e;color:black;padding:2px 6px;border-radius:6px;">AI</span>
  </a>
  <a class="solana-button" href="/swap.html">🔁 Jupiter Swap</a>
  <a href="radar.html" class="solana-button">📊 Market Cycle Radar</a>
  <a href="whitepaper.html" class="solana-button">📄 Read the Whitepaper</a>
  <a href="faq.html" class="solana-button">❓ FAQ</a>
  <a href="sponsor.html" class="solana-button">💰 Become a Partner</a>

  <h2>💼 Services Offered</h2>
  <ul>
    <li>🚀 Software as a Service (SaaS)</li>
    <li>🔐 Wallet Setup & Security</li>
    <li>📊 Technical Analysis & Market Insights</li>
    <li>📈 Token Launch Guidance</li>
    <li>🎓 Educational Sessions & Onboarding</li>
    <li>📞 Strategy Calls & Portfolio Reviews</li>
  </ul>

  <h2>📨 Contact</h2>
  <p>
    <a href="mailto:crimzncipriano@gmail.com" class="solana-button">✉️ Email Me</a>
    <a href="https://t.me/CrimznBot" class="solana-button" target="_blank">🗨️ Telegram @CrimznBot</a>
    <a href="https://discord.com/users/CrimznBot" class="solana-button" target="_blank">🟣 Discord</a>
    <a href="https://x.com/crimzn" class="solana-button" target="_blank">❌ X (Twitter) @crimzn</a>
  </p>
</div>

<p style="color: #00ffff;">© 2025 by <strong>💬 CrimznBot</strong></p>
<p>🚀 Built by Crimzn — powered by Solana & Helius</p>

<script defer src="app-main.js?v=crimznAug27v1"></script>
</body>
</html>
EOF

cat <<'EOF' > solanamind.html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SolanaMind Intelligence</title>
  <link rel="stylesheet" href="app-style.css" />

  <style>
    .page-wrap { max-width: 920px; margin: 0 auto; padding: 18px 14px 40px; }
    .topbar { display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap; margin: 8px 0 16px; }
    .brandline { display:flex; align-items:center; gap:10px; }
    .brain { font-size: 22px; }
    .titleblock h1 { margin: 0; font-size: 22px; }
    .titleblock p { margin: 4px 0 0; opacity: .85; }

    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 14px;
      padding: 14px;
      margin: 12px 0;
    }

    .row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
    .row input {
      flex: 1;
      min-width: 220px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(0,0,0,0.25);
      color: #fff;
      outline: none;
    }

    .muted { opacity: .8; font-size: 13px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

    .grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }

    .metric { display:flex; justify-content:space-between; gap:10px; padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.18); }
    .metric b { font-weight: 700; }
    .metric span { opacity: .9; }

    .chips { display:flex; flex-wrap:wrap; gap:8px; margin-top: 8px; }
    .chip {
      display:inline-flex; align-items:center; gap:6px;
      padding: 6px 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(0,0,0,0.18);
      font-size: 12px;
      opacity: .95;
    }

    .score-wrap { margin-top: 10px; }
    .bar {
      width: 100%;
      height: 12px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      overflow:hidden;
      border: 1px solid rgba(255,255,255,0.10);
    }
    .bar > div { height: 100%; width: 0%; background: #22c55e; }

    .subhead { margin: 0 0 8px; font-size: 14px; opacity: .9; }

    .list { display:flex; flex-direction:column; gap:8px; }
    .li { display:flex; justify-content:space-between; gap:10px; padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.18); }
    .li small { opacity: .8; }

    .pre {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
      line-height: 1.35;
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 12px;
      padding: 12px;
      overflow:auto;
      max-height: 320px;
    }

    .right { display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:flex-end; }
  </style>
</head>

<body>
  <div class="page-wrap">
    <div class="topbar">
      <div class="brandline">
        <div class="brain">🧠</div>
        <div class="titleblock">
          <h1>SolanaMind Intelligence</h1>
          <p class="muted">Wallet intelligence for whale tracking, smart-money clues, counterparties, token noise, and risk scoring.</p>
        </div>
      </div>

      <div class="right">
        <a class="solana-button" href="/">← Back to CryptoConsult</a>
      </div>
    </div>

    <div class="card">
      <div class="subhead">What it does</div>
      <div class="muted" style="line-height:1.5;">
        Paste any Solana wallet to analyze:
        <br><br>
        • top counterparties
        <br>
        • recent SOL flow
        <br>
        • token and NFT noise
        <br>
        • fail-rate patterns
        <br>
        • a heuristic risk score from 0–100
      </div>
    </div>

    <div class="card">
      <div class="subhead">Analyze a wallet</div>
      <div class="row">
        <input id="addr" class="mono" placeholder="Enter Solana wallet address (base58)" />
        <button id="go" class="solana-button">🔍 Analyze</button>
      </div>
      <div class="muted" style="margin-top:10px;">
        Paste any address. You’ll get live wallet metrics plus a recent transaction-based intelligence snapshot.
      </div>
    </div>

    <div id="status" class="muted" style="margin: 10px 0;"></div>

    <div id="results" style="display:none;">
      <div class="card">
        <div class="subhead">Overview</div>
        <div class="grid" id="metrics"></div>

        <div class="score-wrap">
          <div class="muted">Risk score (0–100): <b id="scoreText">—</b></div>
          <div class="bar" title="Higher = safer (heuristic)">
            <div id="scoreBar"></div>
          </div>

          <div class="chips" id="flags"></div>
        </div>
      </div>

      <div class="card">
        <div class="subhead">Top counterparties (by SOL volume in sampled transactions)</div>
        <div class="list" id="cps"></div>
      </div>

      <div class="card">
        <div class="subhead">Raw JSON (debug)</div>
        <div class="pre mono" id="raw"></div>
      </div>
    </div>
  </div>

<script>
  const $ = (id) => document.getElementById(id);

  function fmt(n, d=6) {
    if (n === null || n === undefined) return "—";
    const x = Number(n);
    if (!Number.isFinite(x)) return "—";
    return x.toFixed(d);
  }

  function setStatus(t) {
    $("status").textContent = t || "";
  }

  function riskColor(score) {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#eab308";
    return "#ef4444";
  }

  function metric(label, value) {
    const div = document.createElement("div");
    div.className = "metric";
    div.innerHTML = `<b>${label}</b><span class="mono">${value}</span>`;
    return div;
  }

  async function analyze() {
    const address = ($("addr").value || "").trim();
    if (!address) return setStatus("Enter a wallet address.");

    setStatus("Analyzing…");
    $("results").style.display = "none";

    try {
      const res = await fetch("/api/solanamind/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(`Error: ${data.error || "Request failed"} (${res.status})`);
        return;
      }

      const m = $("metrics");
      m.innerHTML = "";
      m.appendChild(metric("Address", `<span class="mono">${data.address}</span>`));
      m.appendChild(metric("SOL balance", fmt(data.sol_balance, 6)));
      m.appendChild(metric("Tokens", data.token_count ?? "—"));
      m.appendChild(metric("NFT-like", data.nft_like_count ?? "—"));
      m.appendChild(metric("Dust tokens", data.dust_token_count ?? "—"));
      m.appendChild(metric("Tx sampled", data.tx_sampled ?? "—"));
      m.appendChild(metric("Fail rate", fmt((data.fail_rate ?? 0) * 100, 1) + "%"));
      m.appendChild(metric("SOL in", fmt(data.sol_in_50tx, 6)));
      m.appendChild(metric("SOL out", fmt(data.sol_out_50tx, 6)));
      m.appendChild(metric("Net SOL", fmt(data.net_sol_50tx, 6)));
      m.appendChild(metric("Est age (days)", data.est_age_days ?? "—"));

      const score = Number(data.risk_score_0_100 ?? 0);
      $("scoreText").textContent = score;
      $("scoreBar").style.width = Math.max(0, Math.min(100, score)) + "%";
      $("scoreBar").style.background = riskColor(score);

      const flags = Array.isArray(data.flags) ? data.flags : [];
      const f = $("flags");
      f.innerHTML = "";
      if (!flags.length) {
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.textContent = "✅ No major flags detected";
        f.appendChild(chip);
      } else {
        for (const flag of flags) {
          const chip = document.createElement("div");
          chip.className = "chip";
          chip.textContent = "⚠️ " + flag;
          f.appendChild(chip);
        }
      }

      const cps = $("cps");
      cps.innerHTML = "";
      const arr = Array.isArray(data.top_counterparties) ? data.top_counterparties : [];
      if (!arr.length) {
        const div = document.createElement("div");
        div.className = "muted";
        div.textContent = "No counterparties detected in sampled transactions.";
        cps.appendChild(div);
      } else {
        for (const c of arr) {
          const row = document.createElement("div");
          row.className = "li";
          row.innerHTML = `
            <div class="mono" style="max-width:72%; overflow:hidden; text-overflow:ellipsis;">
              ${c.address}
              <div><small class="muted">tap-hold to copy</small></div>
            </div>
            <div class="mono">${fmt(c.sol_volume, 6)} SOL</div>
          `;
          cps.appendChild(row);
        }
      }

      $("raw").textContent = JSON.stringify(data, null, 2);

      $("results").style.display = "block";
      setStatus("✅ Done.");
    } catch (e) {
      setStatus("Error: " + (e?.message || e));
    }
  }

  $("go").addEventListener("click", analyze);
  $("addr").addEventListener("keydown", (e) => {
    if (e.key === "Enter") analyze();
  });
</script>
</body>
</html>
EOF

cat <<'EOF' > swap.html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Jupiter Swap | CryptoConsult</title>
  <link rel="stylesheet" href="app-style.css" />

  <style>
    .page-wrap { max-width: 980px; margin: 0 auto; padding: 18px 14px 28px; }
    .topbar { display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap; margin: 8px 0 14px; }
    .brandline { display:flex; align-items:center; gap:10px; }
    .titleblock h1 { margin: 0; font-size: 22px; }
    .titleblock p { margin: 4px 0 0; opacity: .85; font-size: 13px; }
    .right { display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:flex-end; }

    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.10);
      border-radius: 14px;
      padding: 16px;
      margin: 12px 0;
    }

    .muted { opacity: .82; font-size: 13px; line-height: 1.45; }

    .pill {
      display:inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(0,0,0,0.18);
      font-size: 12px;
      opacity: .92;
      margin-right: 6px;
      margin-bottom: 6px;
    }

    .cta-wrap { text-align:center; margin-top: 18px; }
  </style>
</head>

<body>
  <div class="page-wrap">

    <div class="topbar">
      <div class="brandline">
        <div style="font-size:22px;">🔁</div>
        <div class="titleblock">
          <h1>Jupiter Swap</h1>
          <p class="muted">
            Solana-native swapping through Jupiter. Fast, familiar, and aligned with the rest of CryptoConsult.
          </p>
        </div>
      </div>

      <div class="right">
        <a class="solana-button" href="/">← Back to CryptoConsult</a>
      </div>
    </div>

    <div class="card">
      <div class="muted">
        <span class="pill">Solana-native</span>
        <span class="pill">No CryptoConsult custody</span>
        <span class="pill">Best for SOL ecosystem users</span>

        <div style="margin-top:12px;">
          CryptoConsult does not store wallet addresses, private keys, or swap history.
          When you open Jupiter, you are using an external provider and your wallet app may have its own policies.
        </div>
      </div>
    </div>

    <div class="card">
      <h2 style="margin-top:0;">Why this changed</h2>
      <p class="muted">
        The previous swap experience was unreliable. This version prioritizes a cleaner, better-known Solana trading flow so the page is actually useful when people click it.
      </p>
    </div>

    <div class="card">
      <h2 style="margin-top:0;">Best use case</h2>
      <p class="muted">
        Use this when you want a straightforward way to swap within the Solana ecosystem without turning CryptoConsult into a custody app.
      </p>

      <div class="cta-wrap">
        <a class="solana-button" href="https://jup.ag/swap/SOL-USDC" target="_blank" rel="noopener noreferrer">
          🚀 Open Jupiter
        </a>
      </div>
    </div>

  </div>
</body>
</html>
EOF

cat <<'EOF' > radar.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Market Cycle Radar | CryptoConsult</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <style>
    body {
      background-color: #000;
      color: #f7931a;
      font-family: 'Courier New', monospace;
      text-align: center;
      padding: 20px;
    }
    h1 { font-size: 22px; margin-top: 0.5em; }
    .tab {
      background: #111;
      display: inline-block;
      color: #f7931a;
      margin: 0.3em;
      padding: 10px 20px;
      cursor: pointer;
      border-radius: 8px;
    }
    .tab.active {
      background: #f7931a;
      color: black;
    }
    .chart-container {
      display: none;
      margin-top: 20px;
    }
    .chart-container.active {
      display: block;
    }
    .back-button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background: #111;
      color: #f7931a;
      text-decoration: none;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <h1>📊 Market Cycle Radar</h1>
  <p>Visualize BTC, ETH, SOL, relative-strength pairs, and BTC dominance to help frame trend context and cycle behavior.</p>

  <div class="tab active" data-id="btc">BTC/USD</div>
  <div class="tab" data-id="eth">ETH/USD</div>
  <div class="tab" data-id="sol">SOL/USD</div>
  <div class="tab" data-id="ethbtc">ETH/BTC</div>
  <div class="tab" data-id="solbtc">SOL/BTC</div>
  <div class="tab" data-id="dominance">BTC Dominance</div>

  <div id="btc" class="chart-container active"><div id="btc-chart"></div></div>
  <div id="eth" class="chart-container"><div id="eth-chart"></div></div>
  <div id="sol" class="chart-container"><div id="sol-chart"></div></div>
  <div id="ethbtc" class="chart-container"><div id="ethbtc-chart"></div></div>
  <div id="solbtc" class="chart-container"><div id="solbtc-chart"></div></div>
  <div id="dominance" class="chart-container"><div id="dominance-chart"></div></div>

  <script>
    document.addEventListener("DOMContentLoaded", () => {
      const tabs = document.querySelectorAll('.tab');
      const charts = document.querySelectorAll('.chart-container');

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          const id = tab.getAttribute('data-id');
          charts.forEach(c => c.classList.remove('active'));
          document.getElementById(id).classList.add('active');
        });
      });

      new TradingView.widget({
        container_id: "btc-chart",
        width: "100%",
        height: 600,
        symbol: "BINANCE:BTCUSDT",
        interval: "1D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true
      });

      new TradingView.widget({
        container_id: "eth-chart",
        width: "100%",
        height: 600,
        symbol: "BINANCE:ETHUSDT",
        interval: "1D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true
      });

      new TradingView.widget({
        container_id: "sol-chart",
        width: "100%",
        height: 600,
        symbol: "BINANCE:SOLUSDT",
        interval: "1D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true
      });

      new TradingView.widget({
        container_id: "ethbtc-chart",
        width: "100%",
        height: 600,
        symbol: "BINANCE:ETHBTC",
        interval: "1D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true
      });

      new TradingView.widget({
        container_id: "solbtc-chart",
        width: "100%",
        height: 600,
        symbol: "BINANCE:SOLBTC",
        interval: "1D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true
      });

      new TradingView.widget({
        container_id: "dominance-chart",
        width: "100%",
        height: 600,
        symbol: "CRYPTOCAP:BTC.D",
        interval: "1D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true
      });
    });
  </script>

  <div class="site-footer" style="text-align:center; margin-top:2rem; font-size:14px; color:#f7931a; font-family:'Courier New', Courier, monospace;">
    <p class="foot-copy">© 2025 CryptoConsult by Crimzn. All Rights Reserved.</p>
    <p class="foot-power">⚡ Powered by Solana &amp; Helius</p>
    <a href="index.html" class="btn-back" style="display:inline-block; margin-top:8px; background:none; color:#f14f15; border:1px solid #f14f15; padding:4px 8px; text-decoration:none; border-radius:6px;">⬅ Back to Site</a>
  </div>
</body>
</html>
EOF

cat <<'EOF' > whitepaper.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="CryptoConsult Whitepaper by Crimzn – AI market intelligence, Solana-native tools, and on-chain advisory." />
  <title>CryptoConsult Whitepaper | Crimzn</title>
  <style>
    body {
      background-color: #000;
      color: #f7931a;
      font-family: 'Courier New', Courier, monospace;
      padding: 1rem;
      line-height: 1.5;
    }
    h1, h2, h3 {
      color: #f7931a;
      text-align: center;
    }
    h2 {
      text-decoration: underline;
    }
    button, a.solana-button {
      background: #000;
      color: #14f195;
      border: 1px solid #14f195;
      padding: 10px 20px;
      margin: 8px auto;
      display: block;
      font-family: inherit;
      font-size: 1rem;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      cursor: pointer;
    }
    .section {
      margin-top: 40px;
    }
    .powered {
      text-align: center;
      color: #14f195;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>CryptoConsult by Crimzn</h1>
  <p class="powered">⚡ Powered by Solana & Helius</p>

  <div class="section">
    <h2>Introduction</h2>
    <p>
      CryptoConsult is an all-in-one crypto intelligence platform built for traders, investors, and learners.
      It combines AI, on-chain analytics, market dashboards, and Solana-native tooling into one fast, simple interface.
    </p>
  </div>

  <div class="section">
    <h2>Core Product</h2>
    <p>
      CryptoConsult is designed to help users make better crypto decisions faster.
      The goal is simple: reduce friction, surface useful signal, and make advanced crypto tooling easier to use.
    </p>
  </div>

  <div class="section">
    <h2>Access & Pricing</h2>
    <p>
      Each user gets <strong>3 free questions</strong> with CrimznBot. After that, users can unlock full access with a
      one-time payment of <strong>0.01 SOL (early access pricing)</strong>.
    </p>
    <p>
      Wallet connection is used only for payment verification and optional feature unlocks.
      CryptoConsult does not take custody of user funds.
    </p>
  </div>

  <div class="section">
    <h2>Integrated Tools</h2>
    <ul>
      <li><strong>CrimznBot:</strong> AI assistant for crypto questions, market context, and strategy support</li>
      <li><strong>SolanaMind Intelligence:</strong> wallet-level analytics, counterparties, recent flow clues, and risk scoring</li>
      <li><strong>Market Cycle Radar:</strong> chart dashboards for BTC, ETH, SOL, BTC dominance, and relative-strength pairs</li>
      <li><strong>PulseIt:</strong> sentiment analysis for macro, regulation, ETF flows, war, and crypto narratives</li>
      <li><strong>Jupiter Swap:</strong> a Solana-native route for token swapping without turning CryptoConsult into a custody product</li>
    </ul>
  </div>

  <div class="section">
    <h2>Services Offered</h2>
    <ul>
      <li>Technical and fundamental analysis</li>
      <li>Altcoin rotation strategies</li>
      <li>Wallet setup and security guidance</li>
      <li>On-chain analytics and portfolio planning</li>
      <li>Custom Web3 dashboards, alerts, and integrations</li>
      <li>Educational sessions and crypto onboarding</li>
    </ul>
  </div>

  <div class="section">
    <h2>$CONSOL (Planned)</h2>
    <p>
      CryptoConsult may explore a future <strong>$CONSOL</strong> utility token for feature access, ecosystem perks, or community participation.
      Any details remain experimental and may change.
    </p>
    <p style="opacity:.85">
      This is not an offer, solicitation, or financial advice.
    </p>
  </div>

  <div class="section">
    <h2>Roadmap</h2>
    <ul>
      <li>Improve CrimznBot responses and user flow</li>
      <li>Expand SolanaMind intelligence features</li>
      <li>Refine market dashboards and cycle tools</li>
      <li>Add more Solana-native utilities and integrations</li>
      <li>Develop educational modules such as CryptoKids CryptoQuiz</li>
      <li>Support future Telegram and Discord crypto workflows</li>
    </ul>
  </div>

  <div class="section">
    <h2>License</h2>
    <p>
      © 2025 CryptoConsult by Crimzn. <strong>All Rights Reserved.</strong><br/>
      No copying, redistribution, or derivative works without written consent.
    </p>
  </div>

  <div class="site-footer">
    <p class="foot-copy">© 2025 CryptoConsult by Crimzn. All Rights Reserved.</p>
    <p class="foot-power">⚡ Powered by Solana &amp; Helius</p>
    <a href="index.html" class="btn-back">⬅ Back to Site</a>
  </div>
</body>
</html>
EOF

cat <<'EOF' > faq.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="CryptoConsult FAQ - CrimznBot, wallet verification, Solana tools, pricing, and platform features." />
  <title>FAQ | CryptoConsult</title>
  <style>
    body {
      background-color: #000;
      color: #f7931a;
      font-family: 'Courier New', Courier, monospace;
      padding: 1rem;
      line-height: 1.6;
    }
    h1, h2 {
      color: #f7931a;
      text-align: center;
    }
    .faq-section {
      margin-bottom: 2rem;
    }
    .site-footer {
      text-align: center;
      margin-top: 3rem;
      font-size: 14px;
      color: #f7931a;
    }
    .btn-back {
      display: inline-block;
      margin-top: 8px;
      background: none;
      color: #f14f15;
      border: 1px solid #f14f15;
      padding: 4px 8px;
      text-decoration: none;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <h1>Frequently Asked Questions</h1>

  <div class="faq-section">
    <h2>What is CrimznBot?</h2>
    <p>CrimznBot is CryptoConsult’s AI assistant for crypto questions, live token pricing, market context, and plain-English reasoning.</p>
  </div>

  <div class="faq-section">
    <h2>How does the paywall work?</h2>
    <p>You get <strong>3 free questions total</strong>. After that, you can unlock full access with a one-time payment of <strong>0.01 SOL (early access pricing)</strong>.</p>
  </div>

  <div class="faq-section">
    <h2>Do I need a wallet to use CryptoConsult?</h2>
    <p>No. You can use free mode without a wallet. A wallet is only needed for payment verification and optional feature unlocks.</p>
  </div>

  <div class="faq-section">
    <h2>Does CryptoConsult custody funds or track users?</h2>
    <p>No. CryptoConsult does not take custody of user funds. Wallet connection is used only for verification and unlock flow. No off-chain profile is required to ask questions in free mode.</p>
  </div>

  <div class="faq-section">
    <h2>What is SolanaMind Intelligence?</h2>
    <p>SolanaMind analyzes a Solana wallet for recent flow clues, counterparties, token noise, and a heuristic risk score. It is meant to help users inspect wallet behavior faster.</p>
  </div>

  <div class="faq-section">
    <h2>What is Market Cycle Radar?</h2>
    <p>Market Cycle Radar is a chart dashboard for BTC, ETH, SOL, BTC dominance, and key relative-strength pairs like ETH/BTC and SOL/BTC.</p>
  </div>

  <div class="faq-section">
    <h2>What is PulseIt?</h2>
    <p>PulseIt is a sentiment tool for macro and crypto narratives. It is useful for topics like ETF flows, regulation, war, rates, liquidity, and market mood.</p>
  </div>

  <div class="faq-section">
    <h2>What payments are accepted?</h2>
    <p>CryptoConsult supports Solana Pay for the unlock flow. Some services may also reference Coinbase Commerce or PayPal where applicable.</p>
  </div>

  <div class="faq-section">
    <h2>Is this financial advice?</h2>
    <p>No. CryptoConsult provides consultation, information, and educational guidance only. Nothing on the site should be treated as financial advice.</p>
  </div>

  <div class="faq-section">
    <h2>What is $CONSOL?</h2>
    <p>$CONSOL is a planned future utility concept for CryptoConsult. Possible uses may include feature access, ecosystem perks, or community participation, but nothing is final.</p>
  </div>

  <div class="site-footer">
    <p class="foot-copy">© 2025 CryptoConsult by Crimzn. All Rights Reserved.</p>
    <p class="foot-power">⚡ Powered by Solana &amp; Helius</p>
    <a href="index.html" class="btn-back">⬅ Back to Site</a>
  </div>
</body>
</html>
EOF

cat <<'EOF' > sponsor.html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Become a Partner | CryptoConsult</title>
<style>
    body {
        background-color: #000;
        color: #f7931a;
        font-family: 'Courier New', Courier, monospace;
        padding: 1rem;
        line-height: 1.6;
    }
    h1, h2 {
        text-align: center;
    }
    ul {
        list-style: none;
        padding: 0;
    }
    ul li {
        margin: 0.5rem 0;
        background: rgba(247, 147, 26, 0.1);
        padding: 0.5rem;
        border-left: 4px solid #f7931a;
    }
    .solana-button {
        background-color: #000;
        color: #f7931a;
        border: 1px solid #f7931a;
        padding: 8px 16px;
        text-decoration: none;
        display: inline-block;
        margin-top: 1rem;
    }
    .solana-button:hover {
        background-color: #f7931a;
        color: #000;
    }
    .site-footer {
        text-align: center;
        margin-top: 2rem;
        font-size: 14px;
        color: #f7931a;
    }
</style>
</head>
<body>

<h1>Become a Partner 🤝</h1>
<p style="text-align:center;"><strong>Powered by Solana &amp; Helius</strong></p>

<h2>Why partner with CryptoConsult?</h2>
<p>
CryptoConsult is built for active crypto users who care about market context, wallet behavior, and decision-making tools.
Early partners get direct exposure inside a growing crypto-native product while helping expand access to better analytics and education.
</p>

<h2>Partnership tiers</h2>
<ul>
    <li>
        <strong>Bronze</strong>
        <ul>
            <li>Featured mention on the sponsor page</li>
            <li>Logo placement for early supporters</li>
            <li>Inclusion in selected community updates</li>
        </ul>
    </li>
    <li>
        <strong>Silver</strong>
        <ul>
            <li>All Bronze benefits</li>
            <li>Expanded brand visibility across more site surfaces</li>
            <li>Priority access for discussing custom collaborations</li>
        </ul>
    </li>
    <li>
        <strong>Gold</strong>
        <ul>
            <li>All Silver benefits</li>
            <li>Preferred placement for major partners</li>
            <li>Deeper collaboration opportunities for future tool launches</li>
        </ul>
    </li>
</ul>

<h2>How pricing works</h2>
<p>
Pricing is customized based on placement, duration, and how involved the partnership is.
This keeps early-stage partner options flexible instead of forcing one-size-fits-all packages.
</p>

<h2>Ready to talk?</h2>
<p>
Email <strong>crimzncipriano@gmail.com</strong> or contact <strong>@CrimznBot</strong> on Telegram or Discord to discuss options.
</p>

<a href="mailto:crimzncipriano@gmail.com" class="solana-button">🚀 Become a Partner</a>
<br>
<a href="index.html" class="solana-button">⬅ Back to Site</a>

<div class="site-footer">
    <p>© 2025 CryptoConsult by Crimzn. All Rights Reserved.</p>
    <p>⚡ Powered by Solana &amp; Helius</p>
</div>

</body>
</html>
EOF
