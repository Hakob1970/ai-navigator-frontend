async function sendProblem() {
  const car = document.getElementById("car").value;
  const year = document.getElementById("year").value;
  const vin = document.getElementById("vin").value;
  const problem = document.getElementById("problem").value;

  const resultBox = document.getElementById("result");

  resultBox.innerText = "Analyzing...";

  try {
    const res = await fetch("/api/auto-mechanic", {
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
    });

    const data = await res.json();

    resultBox.innerText = data.result || "No response from AI";
  } catch (err) {
    resultBox.innerText = "Server error. Try again.";
  }
}
