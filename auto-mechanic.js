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
  btn.disabled = true;
  btn.innerText = "🔧 AI Mechanic is analyzing your vehicle...";
  resultBox.innerText = "Analyzing...";

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

    data = await res.json();

    console.log("API DATA:", data);

    // =========================
    // ERROR HANDLING
    // =========================
    if (data.error) {
      resultBox.innerText = data.error;

      btn.disabled = false;
      btn.innerText = "Analyze Problem";

      return;
    }

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
    resultBox.innerText = data.result || "No response from AI";

  } catch (err) {
    console.error(err);
    resultBox.innerText = "Server error. Try again.";
  }

  // =========================
  // RESET BUTTON (SAFE)
  // =========================
  if (!data?.error && (data?.remaining === undefined || data?.remaining > 0)) {
    btn.disabled = false;
    btn.innerText = "Analyze Problem";
  }
}

// =========================
// GET PREMIUM
// =========================
function goPremium() {

  const token = localStorage.getItem("token");

  if (!token) {
    alert("🔐 Please login before purchasing Premium");
    return;
  }

  // Здесь потом вставим Polar
  alert("💳 Opening Premium purchase...");
}
