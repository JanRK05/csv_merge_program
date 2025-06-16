const uploadFilesForm = document.getElementById("upload-files-form");
const uploadFilesInput = document.getElementById("files-upload-input");
const filesList = document.getElementById("files-list");
const description = document.getElementById("description-p");
const filenameInput = document.getElementById("filename");
const exportForm = document.getElementById("export-form");

let uploadedFiles = [];
let mergedCSVContent = "";

// Barve za prve vrstice posameznih datotek
const headerColors = ["#dfefff", "#ffe6df", "#e0ffe0", "#fffacd", "#f0e68c", "#f5e6ff", "#d0f0f0"];

uploadFilesForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (uploadedFiles.length === 0) {
    alert("Izberi vsaj eno CSV datoteko.");
    return;
  }

  const result = await mergeCSVFiles(uploadedFiles);
  mergedCSVContent = result.csv;
  description.textContent = "CSV datoteke uspešno združene.";
  drawCSVOnCanvas(mergedCSVContent, result.headers);
});

uploadFilesForm.addEventListener("reset", () => {
  uploadedFiles = [];
  filesList.innerHTML = "";
  description.textContent = "";
  const canvas = document.getElementById("csv-canvas");
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  mergedCSVContent = "";
  filenameInput.value = "";
});

uploadFilesInput.addEventListener("change", (e) => {
  uploadedFiles = Array.from(e.target.files);
  filesList.innerHTML = "";
  uploadedFiles.forEach((file) => {
    const li = document.createElement("li");
    li.innerHTML = `<i style="color: green;">${file.name} - Naloženo</i>`;
    filesList.appendChild(li);
  });
});

exportForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = filenameInput.value.trim();
  if (!name) {
    alert("Vnesi ime datoteke.");
    return;
  }

  if (!mergedCSVContent) {
    alert("Ni vsebine za izvoz.");
    return;
  }

  downloadCSV(mergedCSVContent, name + ".csv");
});

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function mergeCSVFiles(files) {
  let mergedLines = [];
  let headerLineIndices = [];

  for (let i = 0; i < files.length; i++) {
    const content = await readFileAsText(files[i]);
    const lines = content.trim().split("\n");

    if (lines.length === 0) continue;

    // Shrani, kje se začne vsaka datoteka
    headerLineIndices.push(mergedLines.length);

    mergedLines = mergedLines.concat(lines);
  }

  return { csv: mergedLines.join("\n"), headers: headerLineIndices };
}

function drawCSVOnCanvas(csvText, headerLineIndices) {
  const canvas = document.getElementById("csv-canvas");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const rows = csvText.trim().split("\n");
  const table = rows.map((row) => row.split(","));

  const cellWidth = 180;
  const cellHeight = 40;
  const padding = 5;

  const numRows = table.length;
  const numCols = Math.max(...table.map(r => r.length));

  canvas.width = Math.min(window.innerWidth * 0.95, numCols * cellWidth);
  canvas.height = Math.min(window.innerHeight * 0.7, numRows * cellHeight);

  ctx.font = "14px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  for (let r = 0; r < numRows; r++) {
    const isHeaderRow = headerLineIndices.includes(r);
    const colorIndex = headerLineIndices.indexOf(r) % headerColors.length;
    const bgColor = isHeaderRow ? headerColors[colorIndex] : "#ffffff";

    for (let c = 0; c < table[r].length; c++) {
      const x = c * cellWidth;
      const y = r * cellHeight;

      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, cellWidth, cellHeight);

      ctx.strokeStyle = "#888";
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      ctx.fillStyle = "#000";
      ctx.fillText(table[r][c].trim(), x + padding, y + cellHeight / 2);
    }
  }
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  a.click();
  URL.revokeObjectURL(url);
}
