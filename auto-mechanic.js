async function sendProblem() {
  const car = document.getElementById("car").value;
  const year = document.getElementById("year").value;
  const vin = document.getElementById("vin").value;
  const problem = document.getElementById("problem").value;

  const resultBox = document.getElementById("result");

  const usageBox = document.getElementById("usageInfo");

  resultBox.innerText = "Analyzing...";

  try {

    const res = await fetch(
      "https://ai-navigator-backend-mcb3.onrender.com/api/auto-mechanic",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

    if (data.remaining !== undefined) {

  const date = new Date(Number(data.resetAt));

  usageBox.innerHTML = `
    🚗 Remaining: <b>${data.remaining}</b> / 50 <br>
    🔄 Reset: ${date.toLocaleDateString()}
  `;

  // блокировка кнопки если 0
  if (data.remaining <= 0) {
    document.querySelector("button").disabled = true;
    document.querySelector("button").innerText = "Limit reached";
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
