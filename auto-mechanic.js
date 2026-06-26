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
  console.log("SEND PROBLEM STARTED");

  const car = document.getElementById("car").value.trim();
  const year = document.getElementById("year").value.trim();
  const engine = document.getElementById("engine").value.trim();
  const vin = document.getElementById("vin").value.trim();
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
  resultBox.innerHTML = `<div class="scan-loader">🚗 Scanning...</div>`;

  let data;
  let remaining = -1; // ✅ ОБЪЯВЛЯЕМ ЗДЕСЬ

  try {
    console.log("BEFORE FETCH");

    const res = await fetch(
      "https://ai-navigator-backend-mcb3.onrender.com/api/auto-mechanic",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          car,
          year,
          engine,
          vin,
          problem,
        }),
      }
    );

    console.log("AFTER FETCH");

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));

      // =========================
      // NO SUBSCRIPTION / PREMIUM ERROR
      // =========================
      if (
        err.error === "NO_SUBSCRIPTION" ||
        err.error === "AUTO_MECHANIC_PREMIUM_REQUIRED"
      ) {
        resultBox.innerHTML = `
          <div class="diag-card error">
            ❌ Auto Mechanic Premium required<br><br>
            <button onclick="goPremium('auto-mechanic')">
              🔓 Upgrade to Premium
            </button>
          </div>
        `;

        usageBox.innerHTML = "🔒 Premium required";
        resetButton(btn);
        return;
      }

      // =========================
      // OTHER ERRORS
      // =========================
      setError(btn, resultBox, err.error || "Server error");
      return;
    }

    data = await res.json();

    console.log("API DATA:", data);

    // =========================
    // USAGE INFO
    // =========================
    // ✅ ИСПРАВЛЕНО: убрал const
    if (data.remaining !== undefined) {
      remaining = data.remaining;
      const resetText = data.resetAt
        ? `🔄 Reset: ${new Date(Number(data.resetAt)).toLocaleDateString()}`
        : "";

      usageBox.innerHTML = `
        🚗 Remaining: <b>${remaining}</b> / 20 <br>
        ${resetText}
      `;

      // 🚨 если лимит закончился
      if (remaining <= 0) {
        btn.disabled = true;
        btn.innerText = "Limit reached";
      }
    }

// =========================
// RESULT (улучшенная версия с иконками)
// =========================
const result = typeof data.result === "object" ? data.result : null;

if (!result) {
  resultBox.innerHTML = `<div class="diag-card error">❌ ${data.result}</div>`;
  return;
}

// Определяем серьезность проблемы
const severity = result.severity || "medium";
const severityIcon = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢"
}[severity] || "🟡";

let html = `<div class="diag-card">`;

// Заголовок с кодом и серьезностью
html += `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">`;
html += `<h2 style="margin:0;">${result.title || "Диагностика"}</h2>`;
if (result.code) {
  html += `<span class="diag-code" style="background:#f0f0f0; padding:5px 12px; border-radius:20px; font-size:14px; font-weight:bold;">🔧 ${result.code}</span>`;
}
html += `</div>`;

// Основная причина
if (result.most_likely_cause) {
  html += `
    <div style="background:#fff3cd; border-left:4px solid #ffc107; padding:10px 15px; border-radius:4px; margin-bottom:15px;">
      <b>🔍 Основная причина:</b> ${result.most_likely_cause}
    </div>
  `;
}

// Вторичные причины
if (result.secondary_causes && result.secondary_causes.length > 0) {
  html += `<div style="margin-bottom:15px;">`;
  html += `<b>📋 Вторичные причины:</b>`;
  html += `<ul style="margin-top:5px;">`;
  result.secondary_causes.forEach(c => {
    html += `<li style="padding:3px 0;">${c}</li>`;
  });
  html += `</ul></div>`;
}

// Рекомендуемые проверки
if (result.recommended_checks && result.recommended_checks.length > 0) {
  html += `<div style="margin-bottom:15px;">`;
  html += `<b>🔧 Рекомендуемые проверки:</b>`;
  html += `<ul style="margin-top:5px;">`;
  result.recommended_checks.forEach(c => {
    html += `<li style="padding:3px 0;">${c}</li>`;
  });
  html += `</ul></div>`;
}

// Предлагаемый ремонт
if (result.suggested_fix && result.suggested_fix.length > 0) {
  html += `<div style="margin-top:10px; background:#d4edda; border-left:4px solid #28a745; padding:10px 15px; border-radius:4px;">`;
  html += `<b>✅ Предлагаемый ремонт:</b>`;
  html += `<ul style="margin-top:5px;">`;
  result.suggested_fix.forEach(c => {
    html += `<li style="padding:3px 0;">${c}</li>`;
  });
  html += `</ul></div>`;
}

// Дополнительная информация (если есть)
if (result.notes) {
  html += `<div style="margin-top:10px; color:#666; font-style:italic; border-top:1px solid #eee; padding-top:10px;">`;
  html += `💡 ${result.notes}`;
  html += `</div>`;
}

html += `</div>`;

resultBox.innerHTML = html;

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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          module,
        }),
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
