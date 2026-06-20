function resetButton(btn) {
  btn.disabled = false;
  btn.innerText = "Analyze Problem";
}

function setLoading(btn) {
  btn.disabled = true;
  btn.innerText = "🔄 Running diagnostic scan...";
}

function setError(btn, box, msg) {
  box.innerHTML = `❌ ${msg}`;
  resetButton(btn);
}


async function sendProblem() {
  const car = document.getElementById("car").value.trim();
  const year = document.getElementById("year").value.trim();
  const vin = document.getElementById("vin").value.trim(); // optional
  const problem = document.getElementById("problem").value.trim();

  const btn = document.getElementById("analyzeBtn");
  const resultBox = document.getElementById("result");
  const usageBox = document.getElementById("usageInfo");

  console.log("USAGE BOX ELEMENT:", usageBox);

  const token = localStorage.getItem("token");


  // =========================
  // LOGIN CHECK
  // =========================
  if (!token) {
    resultBox.innerText = "❌ Please login";
    return;
  }

  // =========================
  // REQUIRED FIELDS CHECK
  // =========================
  if (!car || !year || !problem) {
    resultBox.innerText = "⚠️ Please fill Car, Year and Problem";
    return;
  }

  // =========================
  // LOADING STATE
  // =========================
setLoading(btn);

resultBox.innerHTML = `
  <div class="scan-loader">🚗 Scanning...</div>
`;

  let data;

  try {
    const res = await fetch(
      "https://ai-navigator-backend-mcb3.onrender.com/api/auto-mechanic",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          car,
          year,
          vin,
          problem
        })
      }
    );

 if (!res.ok) {
  const err = await res.json().catch(() => ({}));

 setError(btn, resultBox, err.error || "Server error");
  return;
}

    data = await res.json();

    console.log("API DATA:", data);

    // =========================
    // USAGE INFO
    // =========================
  if (data.remaining !== undefined) {

  const remaining = data.remaining;
  const resetText = data.resetAt
    ? `🔄 Reset: ${new Date(Number(data.resetAt)).toLocaleDateString()}`
    : "";

  usageBox.innerHTML = `
    🚗 Remaining: <b>${remaining}</b> / 50 <br>
    ${resetText}
  `;

  // 🚨 если лимит закончился
  if (remaining <= 0) {
    btn.disabled = true;
    btn.innerText = "Limit reached";
  }
}

    // =========================
    // RESULT
    // =========================
   resultBox.innerHTML = formatMechanicReport(data.result || "No response from AI");

  } catch (err) {
    console.error(err);
    resultBox.innerText = "Server error. Try again.";
  }
}

// =========================
// GET PREMIUM
// =========================
async function goPremium(module) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("🔐 Please login first");
    return;
  }

  const email = localStorage.getItem("email");

  try {
    const res = await fetch(
    "https://ai-navigator-backend-mcb3.onrender.com/api/polar/create-checkout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          module
        })
      }
    );

    const data = await res.json();

 if (data.url) {
  window.location.href = data.url;
      return;
    }

    alert("❌ Cannot start payment");
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}


function formatMechanicReport(text) {
  if (!text) {
    return `<div class="diag-card error">No diagnostic data</div>`;
  }

  return `
  <div class="diag-card">

    <div class="diag-header">
      🚗 AI DIAGNOSTIC SCAN REPORT
    </div>

    <div class="diag-status">
      🔍 Scan completed successfully
    </div>

    <div class="diag-body">
      <div class="section full">
        <pre>${escapeHtml(text)}</pre>
      </div>
    </div>

  </div>
  `;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
