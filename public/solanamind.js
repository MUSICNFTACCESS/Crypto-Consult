async function analyze() {
  const wallet = document.getElementById("wallet").value.trim();
  const out = document.getElementById("output");
  out.textContent = "Analyzing…";

  if (!wallet) {
    out.textContent = "Enter a wallet address.";
    return;
  }

  try {
    const res = await fetch("/api/solanamind/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet })
    });

    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    out.textContent = "Error: " + e.message;
  }
}
