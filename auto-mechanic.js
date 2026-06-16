async function sendProblem() {

  const car = document.getElementById("car").value;
  const year = document.getElementById("year").value;
  const vin = document.getElementById("vin").value;
  const problem = document.getElementById("problem").value;

  const btn = document.getElementById("analyzeBtn");
  const resultBox = document.getElementById("result");
  const usageBox = document.getElementById("usageInfo");

  btn.disabled = true;
  btn.innerText = "Analyzing...";

  resultBox.innerText = "Analyzing...";

  const token = localStorage.getItem("token");

  // =========================
  // LOGIN CHECK
  // =========================
  if (!token) {

    resultBox.innerText = "❌ Please login";

    btn.disabled = false;
    btn.innerText = "Analyze Problem";

    return;
  }

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

  // 🔥 лёгкий акцент
  box.style.boxShadow = "0 0 20px #ff7a18";

  setTimeout(() => {
    box.style.boxShadow = "none";
  }, 1500);
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

      btn.disabled = false;
      btn.innerText = "Analyze Problem";

      return;
    }

    // =========================
    // USAGE INFO
    // =========================
    if (data.remaining !== undefined) {

      const date = new Date(Number(data.resetAt));

      usageBox.innerHTML = `
        🚗 Remaining: <b>${data.remaining}</b> / 50 <br>
        🔄 Reset: ${date.toLocaleDateString()}
      `;

      // лимит закончился
      if (data.remaining <= 0) {

        btn.disabled = true;
        btn.innerText = "Limit reached";

      } else {

        btn.disabled = false;
        btn.innerText = "Analyze Problem";
      }
    }

    // =========================
    // RESULT
    // =========================
    resultBox.innerText =
      data.result || "No response from AI";

  }

  catch (err) {

    console.error(err);

    resultBox.innerText =
      "Server error. Try again.";

    btn.disabled = false;
    btn.innerText = "Analyze Problem";
  }
}
