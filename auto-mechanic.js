async function sendProblem() {
  const car = document.getElementById("car").value;
  const year = document.getElementById("year").value;
  const vin = document.getElementById("vin").value;
  const problem = document.getElementById("problem").value;
  const btn = document.getElementById("analyzeBtn");
  const resultBox = document.getElementById("result");
 const usageBox = document.getElementById("usageInfo");

resultBox.innerText = "Analyzing...";

const token = localStorage.getItem("token");

const res = await fetch(
  "https://ai-navigator-backend-mcb3.onrender.com/api/auto-mechanic",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      car: car.value,
      year: year.value,
      vin: vin.value,
      problem: problem.value
    })
  }
);

    const data = await res.json();

    if (data.remaining !== undefined) {

  const date = new Date(Number(data.resetAt));

  usageBox.innerHTML = `
    🚗 Remaining: <b>${data.remaining}</b> / 50 <br>
    🔄 Reset: ${date.toLocaleDateString()}
  `;

  // блокировка кнопки если 0
  if (data.remaining <= 0) {
   

btn.disabled = true;
btn.innerText = "Limit reached";
  }
}

    resultBox.innerText =
      data.result || "No response from AI";

  } catch (err) {

    console.error(err);

    resultBox.innerText =
      "Server error. Try again.";

  }
}
