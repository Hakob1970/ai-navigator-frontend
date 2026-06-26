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
    // RESULT
    // =========================
    const result = typeof data.result === "object" ? data.result : null;

    if (!result) {
      resultBox.innerHTML = `<div class="diag-card error">❌ ${data.result}</div>`;
      return;
    }

    resultBox.innerHTML = `
      <div class="diag-card">
        <div class="diag-code">🔧 ${result.code || "UNKNOWN"}</div>
        <h2>${result.title || "No title"}</h2>
        <p><b>Main cause:</b> ${result.most_likely_cause || "N/A"}</p>
        <p><b>Secondary causes:</b></p>
        <ul>
          ${(result.secondary_causes || []).map((c) => `<li>${c}</li>`).join("")}
        </ul>
        <p><b>Checks:</b></p>
        <ul>
          ${(result.recommended_checks || [])
            .map((c) => `<li>${c}</li>`)
            .join("")}
        </ul>
        <p><b>Fix:</b></p>
        <ul>
          ${(result.suggested_fix || []).map((c) => `<li>${c}</li>`).join("")}
        </ul>
      </div>
    `;
  } catch (err) {
    console.error(err);
    resultBox.innerText = "Server error. Try again.";
  } finally {
    // ✅ ИСПРАВЛЕНО: проверяем что remaining не 0
    // ✅ И проверяем что remaining был установлен (не -1)
    if (remaining !== 0 && remaining !== -1) {
      resetButton(btn);
    } else if (remaining === 0) {
      // Лимит достигнут - не включаем кнопку
      btn.disabled = true;
      btn.innerText = "Limit reached";
    } else {
      // Если осталось -1 (не было ответа от сервера)
      resetButton(btn);
    }
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
