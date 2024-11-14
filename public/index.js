const downloadButton = document.getElementById("downloadButton");

downloadButton.addEventListener("click", async () => {
  downloadButton.disabled = true;

  const candidatesResponse = await fetch("/candidates");

  const candidatesData = await candidatesResponse.json();

  console.log(candidatesData.data);

  const csvData = convertToCSV(candidatesData.data);

  downloadCSV(csvData, "candidates_with_job_applications.csv");

  downloadButton.disabled = false;
});

function convertToCSV(data) {
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(","));
  return [headers, ...rows].join("\n");
}

function downloadCSV(csvData, filename) {
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}
