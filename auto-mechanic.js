async function sendProblem() {
  const car = document.getElementById("car").value.trim();
  const year = document.getElementById("year").value.trim();
  const vin = document.getElementById("vin").value.trim(); // optional
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
  // REQUIRED FIELDS CHECK
  // (VIN НЕ обязателен)
  // =========================
  if (!car || !year || !problem) {
    resultBox.innerText = "⚠️ Please fill Car, Year and Problem";
    return;
  }

  // =========================
  // LOADING STATE
  // =========================
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
      resultBox.innerText = data.error;
      btn.disabled = false;
      btn.innerText = "Analyze Problem";
      return;
    }

    // =========================
    // USAGE INFO
    // =========================
    if (data.remaining !== undefined) {
      usageBox.innerHTML = `🚗 Remaining: <b>${data.remaining}</b> / 50`;
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
  // RESET BUTTON
  // =========================
  btn.disabled = false;
  btn.innerText = "Analyze Problem";
}
