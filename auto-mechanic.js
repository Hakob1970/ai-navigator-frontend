let isLoading = false;

// =========================
// BUTTON STATE CONTROL
// =========================
function toggleAnalyzeButton() {
  if (isLoading) return;

  const car = document.getElementById("car").value.trim();
  const year = document.getElementById("year").value.trim();
  const problem = document.getElementById("problem").value.trim();

  const btn = document.getElementById("analyzeBtn");

  if (car && year && problem) {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
  } else {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
  }
}

// =========================
// INIT LISTENERS
// =========================
document.getElementById("car").addEventListener("input", toggleAnalyzeButton);
document.getElementById("year").addEventListener("input", toggleAnalyzeButton);
document.getElementById("problem").addEventListener("input", toggleAnalyzeButton);

toggleAnalyzeButton();

// =========================
// MAIN FUNCTION
// =========================
async function sendProblem() {
  const car = document.getElementById("car").value.trim();
  const year = document.getElementById("year").value.trim();
  const vin = document.getElementById("vin").value.trim();
  const problem = document.getElementById("problem").value.trim();

  const btn = document.getElementById("analyzeBtn");
  const resultBox = document.getElementById("result");
  const usageBox = document.getElementById("usageInfo");

  const token = localStorage.getItem("token");

  // =========================
  // LOGIN CHECK
  // =========================
  if (!token) {
    resultBox.innerText = "❌ Please login";
    return;
  }

  // =========================
  // LOADING STATE START
  // =========================
  isLoading = true;
  btn.disabled = true;
  btn.innerText = "Analyzing...";
  resultBox.innerText = "Analyzing...";

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

    const data = await res.json();

    // =========================
    // ERROR HANDLING
    // =========================
    if (data.error) {
      if (data.error === "AUTO_MECHANIC_PREMIUM_REQUIRED") {
        resultBox.innerText = "🚗 Premium required";

        const box = document.querySelector(".pricing-card");
        box.scrollIntoView({ behavior: "smooth" });

        box.style.boxShadow = "0 0 20px #ff7a18";
        setTimeout(() => (box.style.boxShadow = "none"), 1500);
      }

      else if (data.error === "MONTHLY_LIMIT_REACHED") {
        resultBox.innerText = "❌ Monthly limit reached";
      }

      else if (data.error === "TOO_FAST_REQUEST") {
        resultBox.innerText = "⚠️ Too many requests";
      }

      else {
        resultBox.innerText = data.error;
      }

      return;
    }

    // =========================
    // USAGE INFO
    // =========================
    if (data.remaining !== undefined) {
      usageBox.innerHTML = `
        🚗 Remaining: <b>${data.remaining}</b> / 50
      `;

      if (data.remaining <= 0) {
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
  // LOADING STATE END
  // =========================
  isLoading = false;
  toggleAnalyzeButton();

  if (btn.innerText !== "Limit reached") {
    btn.innerText = "Analyze Problem";
  }
}
