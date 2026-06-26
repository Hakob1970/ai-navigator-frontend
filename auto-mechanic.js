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

  if (!token) {
    resultBox.innerText = "❌ Please login";
    return;
  }

  if (!car || !year || !problem) {
    resultBox.innerText = "⚠️ Please fill Car, Year and Problem";
    return;
  }

  setLoading(btn);
  resultBox.innerHTML = `<div class="scan-loader">🚗 Scanning...</div>`;

  let data;
  let remaining = -1;

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

      setError(btn, resultBox, err.error || "Server error");
      return;
    }

    data = await res.json();
    console.log("API DATA:", data);

    if (data.remaining !== undefined) {
      remaining = data.remaining;
      const resetText = data.resetAt
        ? `🔄 Reset: ${new Date(Number(data.resetAt)).toLocaleDateString()}`
        : "";

      usageBox.innerHTML = `
        🚗 Remaining: <b>${remaining}</b> / 20 <br>
        ${resetText}
      `;

      if (remaining <= 0) {
        btn.disabled = true;
        btn.innerText = "Limit reached";
      }
    }

  // =========================
// RESULT - С ЦВЕТОМ #0B1220
// =========================
const result = typeof data.result === "object" ? data.result : null;

if (!result) {
  resultBox.innerHTML = `<div class="diag-card error">❌ ${data.result}</div>`;
  return;
}

// Определяем язык
const problemText = result.title || result.most_likely_cause || '';
const lang = /[а-яА-Я]/.test(problemText) ? 'ru' : 'en';
const labels = lang === 'en' ? {
  code: '🔧 Code',
  mainCause: '🔍 Main cause:',
  secondary: '📋 Secondary causes:',
  checks: '🔧 Recommended checks:',
  fix: '✅ Suggested fix:',
  diagnosis: 'Diagnosis'
} : {
  code: '🔧 Код ошибки',
  mainCause: '🔍 Основная причина:',
  secondary: '📋 Вторичные причины:',
  checks: '🔧 Рекомендуемые проверки:',
  fix: '✅ Предлагаемый ремонт:',
  diagnosis: 'Диагностика'
};

// Основной блок с цветом #0B1220
let html = `<div style="background:#0B1220; color:#e0e0e0; padding:20px; border-radius:10px; max-width:100%; word-wrap:break-word; overflow-wrap:break-word;">`;

// Заголовок с кодом
html += `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #1a2a4a; padding-bottom: 10px; margin-bottom: 15px; flex-wrap:wrap; gap:10px;">`;
html += `<h2 style="margin:0; word-wrap:break-word; color:#ffffff;">${result.title || labels.diagnosis}</h2>`;
if (result.code) {
  html += `<span style="background:#00ff88; color:#0B1220; padding:8px 16px; border-radius:8px; font-family:'Courier New',monospace; font-size:16px; font-weight:bold; white-space:nowrap;">🔴 ${result.code.toUpperCase()}</span>`;
}
html += `</div>`;

// Основная причина
if (result.most_likely_cause) {
  html += `
    <div style="padding:10px 0; margin-bottom:10px; word-wrap:break-word; overflow-wrap:break-word; max-width:100%; border-bottom:1px solid #1a2a4a;">
      <b style="color:#64b5f6;">${labels.mainCause}</b> ${result.most_likely_cause}
    </div>
  `;
}

// Вторичные причины
if (result.secondary_causes && result.secondary_causes.length > 0) {
  html += `<div style="margin-bottom:15px; padding:10px 0; border-bottom:1px solid #1a2a4a;">`;
  html += `<b style="color:#64b5f6;">${labels.secondary}</b>`;
  html += `<ul style="margin-top:5px; padding-left:20px; word-wrap:break-word; overflow-wrap:break-word; color:#e0e0e0;">`;
  result.secondary_causes.forEach(c => {
    html += `<li style="padding:3px 0; word-wrap:break-word; overflow-wrap:break-word;">${c}</li>`;
  });
  html += `</ul></div>`;
}

// Рекомендуемые проверки
if (result.recommended_checks && result.recommended_checks.length > 0) {
  html += `<div style="margin-bottom:15px; padding:10px 0; border-bottom:1px solid #1a2a4a;">`;
  html += `<b style="color:#64b5f6;">${labels.checks}</b>`;
  html += `<ul style="margin-top:5px; padding-left:20px; word-wrap:break-word; overflow-wrap:break-word; color:#e0e0e0;">`;
  result.recommended_checks.forEach(c => {
    html += `<li style="padding:3px 0; word-wrap:break-word; overflow-wrap:break-word;">${c}</li>`;
  });
  html += `</ul></div>`;
}

// Предлагаемый ремонт
if (result.suggested_fix && result.suggested_fix.length > 0) {
  html += `<div style="margin-top:10px; padding:10px 0; word-wrap:break-word; overflow-wrap:break-word; max-width:100%;">`;
  html += `<b style="color:#64b5f6;">${labels.fix}</b>`;
  html += `<ul style="margin-top:5px; padding-left:20px; word-wrap:break-word; overflow-wrap:break-word; color:#e0e0e0;">`;
  result.suggested_fix.forEach(c => {
    html += `<li style="padding:3px 0; word-wrap:break-word; overflow-wrap:break-word;">${c}</li>`;
  });
  html += `</ul></div>`;
}

html += `</div>`;
resultBox.innerHTML = html;

  } catch (err) {
    console.error(err);
    resultBox.innerText = "Server error. Try again.";
  } finally {
    if (remaining !== 0 && remaining !== -1) {
      resetButton(btn);
    } else if (remaining === 0) {
      btn.disabled = true;
      btn.innerText = "Limit reached";
    } else {
      resetButton(btn);
    }
  }
}

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
