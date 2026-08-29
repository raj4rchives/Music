const KEY = "jee370rTrackerV3";
const LEGACY_V2 = "jee370rTrackerV2";
const LEGACY_V1 = "jee370rTrackerV1";

// Tere naye HTML <thead> order ke exact same mapping:
const fields = [
  "date",      // 1. DATE
  "lec",       // 2. LEC TOTAL
  "phyWork",   // 3. PHY HW / CLASS ILLU
  "chemWork",  // 4. CHEM HW / CLASS ILLU
  "mathWork",  // 5. MATH HW / CLASS ILLU
  "phyDpp",    // 6. PHY DPP (Naya order)
  "chemDpp",   // 7. CHEM DPP
  "mathDpp",   // 8. MATH DPP
  "phyPyq",    // 9. PHY PYQ
  "chemPyq",   // 10. CHEM PYQ
  "mathPyq"    // 11. MATH PYQ
];


const tbody = document.querySelector("#tracker tbody");

// 1. Helper Functions
function num(v) {
  const m = String(v || "").match(/\d+/);
  return m ? Number(m[0]) : 0;
}

function sumField(data, field) {
  return data.reduce((s, r) => s + num(r[field]), 0);
}

function put(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function combine(a, b) {
  const x = String(a || "").trim(), y = String(b || "").trim();
  if (x && y) return `${x} + ${y}`;
  return x || y;
}

// 2. Table Rows Manager
function makeRows() {
  if (!tbody) return;
  tbody.innerHTML = "";
  addRows(15);
}

function addRows(count = 15) {
  if (!tbody) return;
  const start = tbody.children.length;
  for (let i = 0; i < count; i++) {
    const tr = document.createElement("tr");
    tr.dataset.i = start + i;
    tr.innerHTML = fields.map((f, j) => 
      `<td><input data-f="${f}" ${j === 0 ? 'type="date"' : ''} inputmode="numeric"></td>`
    ).join("");
    tbody.appendChild(tr);
    
    tr.querySelectorAll("input").forEach(x => {
      x.addEventListener("input", () => {
        updateStats();
        autoExtendRows();
      });
    });
  }
}

function rowsData() {
  if (!tbody) return [];
  return [...tbody.querySelectorAll("tr")].map(tr => {
    const o = {};
    tr.querySelectorAll("input").forEach(i => o[i.dataset.f] = i.value);
    return o;
  });
}

function setData(data) {
  makeRows();
  (data || []).forEach((o, i) => {
    while (i >= tbody.children.length) addRows(15);
    const tr = tbody.children[i];
    fields.forEach(f => {
      if (o[f] != null) {
        const input = tr.querySelector(`[data-f="${f}"]`);
        if (input) input.value = o[f];
      }
    });
  });
  updateStats();
}

function autoExtendRows() {
  if (!tbody) return;
  const rows = [...tbody.children];
  const last = rows.slice(-3);
  if (last.some(tr => [...tr.querySelectorAll("input")].some(i => i.value.trim() !== ""))) {
    addRows(15);
  }
}

// 3. Migration & LocalStorage Logic
function migrateData() {
  const v3 = JSON.parse(localStorage.getItem(KEY) || "null");
  if (v3 && Array.isArray(v3.rows)) return v3;

  const v2 = JSON.parse(localStorage.getItem(LEGACY_V2) || "null");
  if (v2 && Array.isArray(v2.rows)) {
    return {
      startDate: v2.startDate || "",
      examDate: v2.examDate || "",
      rows: v2.rows.map(r => ({
        date: r.date || "", lec: r.lec || "",
        phyWork: combine(r.phyHw, r.phyIllu),
        chemWork: combine(r.chemHw, r.chemIllu),
        mathWork: combine(r.mathHw, r.mathIllu),
        chemDpp: r.chemDpp || "", mathDpp: r.mathDpp || "",
        phyPyq: r.phyPyq || "", chemPyq: r.chemPyq || "", mathPyq: r.mathPyq || ""
      }))
    };
  }

  const v1 = JSON.parse(localStorage.getItem(LEGACY_V1) || "null");
  if (v1 && Array.isArray(v1.rows)) {
    return {
      startDate: v1.startDate || "",
      examDate: v1.examDate || "",
      rows: v1.rows.map(r => ({
        date: r.date || "", lec: r.lec || "",
        phyWork: r.phy || "", chemWork: r.chem || "", mathWork: r.math || "",
        chemDpp: r.chemDpp || "", mathDpp: r.mathDpp || "",
        phyPyq: r.pyq || "", chemPyq: "", mathPyq: ""
      }))
    };
  }
  return null;
}

function save() {
  const startEl = document.querySelector("#startDate");
  const examEl = document.querySelector("#examDate");
  localStorage.setItem(KEY, JSON.stringify({
    startDate: startEl ? startEl.value : "",
    examDate: examEl ? examEl.value : "",
    rows: rowsData()
  }));
  alert("Progress saved on this device.");
}

function load() {
  const x = migrateData();
  if (!x) { alert("No saved tracker found."); return; }
  const startEl = document.querySelector("#startDate");
  const examEl = document.querySelector("#examDate");
  if (startEl) startEl.value = x.startDate || "";
  if (examEl) examEl.value = x.examDate || examEl.value;
  setData(x.rows);
  save();
}

function clearAll() {
  if (!confirm("Clear all study data?")) return;
  localStorage.removeItem(KEY);
  const startEl = document.querySelector("#startDate");
  if (startEl) startEl.value = "";
  setData([]);
}

function fillDates() {
  const startEl = document.querySelector("#startDate");
  const s = startEl ? startEl.value : "";
  if (!s) { alert("Select a start date first."); return; }
  const d = new Date(s + "T00:00:00");
  [...tbody.children].forEach((tr, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    const dateInput = tr.querySelector('[data-f="date"]');
    if (dateInput) dateInput.value = x.toISOString().slice(0, 10);
  });
  updateStats();
}

// 4. Statistics Calculation
function updateStats() {
  const data = rowsData();
  const done = data.filter(r => Object.values(r).some(v => String(v || "").trim() !== "")).length;
  const lec = sumField(data, "lec");

  const phyWork = sumField(data, "phyWork");
  const chemWork = sumField(data, "chemWork");
  const mathWork = sumField(data, "mathWork");
  const chemDpp = sumField(data, "chemDpp");
  const mathDpp = sumField(data, "mathDpp");
  const phyPyq = sumField(data, "phyPyq");
  const chemPyq = sumField(data, "chemPyq");
  const mathPyq = sumField(data, "mathPyq");

  const phy = phyWork + phyPyq;
  const chem = chemWork + chemDpp + chemPyq;
  const math = mathWork + mathDpp + mathPyq;
  const overall = phy + chem + math;
  const pyq = phyPyq + chemPyq + mathPyq;
  const dpp = chemDpp + mathDpp;
  const avg = done ? Math.round(overall / done) : 0;
  const target = done ? Math.min(100, Math.round(overall / (done * 70) * 100)) : 0;

  put("daysDone", done);
  put("lecSum", lec);
  put("questionSum", overall);
  put("pyqSum", pyq);
  put("avgQ", avg);
  put("qTarget", target + "%");

  put("phyWorkSum", phyWork); put("chemWorkSum", chemWork); put("mathWorkSum", mathWork); put("workSum", phyWork + chemWork + mathWork);
  put("phyDppSum", 0); put("chemDppSum", chemDpp); put("mathDppSum", mathDpp); put("dppSum", dpp);
  put("phyPyqSum", phyPyq); put("chemPyqSum", chemPyq); put("mathPyqSum", mathPyq); put("pyqDetailSum", pyq);
  put("phyTotal", phy); put("chemTotal", chem); put("mathTotal", math); put("overallTotal", overall);
}

// 5. Monthly Reporting Helpers
function monthKey(date) { return String(date || '').slice(0, 7); }
function getMonths() { return [...new Set(rowsData().map(r => monthKey(r.date)).filter(Boolean))].sort(); }
function phaseNumber(key) { const keys = getMonths(); const i = keys.indexOf(key); return i < 0 ? '—' : i + 1; }
function monthRows(key) { return rowsData().filter(r => monthKey(r.date) === key); }

function monthSummary(key) {
  const d = monthRows(key);
  const done = d.filter(r => Object.values(r).some(v => String(v || '').trim() !== '')).length;
  const sum = f => d.reduce((a, r) => a + num(r[f]), 0);
  const phyWork = sum('phyWork'), chemWork = sum('chemWork'), mathWork = sum('mathWork');
  const chemDpp = sum('chemDpp'), mathDpp = sum('mathDpp');
  const phyPyq = sum('phyPyq'), chemPyq = sum('chemPyq'), mathPyq = sum('mathPyq');
  const phy = phyWork + phyPyq, chem = chemWork + chemDpp + chemPyq, math = mathWork + mathDpp + mathPyq;
  return { days: done, lec: sum('lec'), phyWork, chemWork, mathWork, chemDpp, mathDpp, phyPyq, chemPyq, mathPyq, phy, chem, math, total: phy + chem + math, pyq: phyPyq + chemPyq + mathPyq };
}

function updateCountdown() {
  const input = document.querySelector('#examDate');
  const out = document.querySelector('#countdown');
  const label = document.querySelector('#examDateLabel');
  if (!input || !out) return;
  const v = input.value;
  if (!v) { out.textContent = '—'; if (label) label.textContent = 'Set your target exam date above'; return; }
  const target = new Date(v + 'T00:00:00');
  const now = new Date();
  target.setHours(0, 0, 0, 0); now.setHours(0, 0, 0, 0);
  const days = Math.ceil((target - now) / 86400000);
  out.textContent = days > 0 ? `${days} DAYS LEFT` : days === 0 ? 'EXAM DAY' : 'DATE PASSED';
  if (label) label.textContent = target.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// 6. Exports & Import
function exportJSON() {
  const startEl = document.querySelector('#startDate');
  const examEl = document.querySelector('#examDate');
  const payload = {
    version: 5,
    exportedAt: new Date().toISOString(),
    startDate: startEl ? startEl.value : "",
    examDate: examEl ? examEl.value : "",
    rows: rowsData()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'jee-tracker-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const x = JSON.parse(r.result);
      if (!Array.isArray(x.rows)) throw new Error('Invalid backup');
      const startEl = document.querySelector('#startDate');
      const examEl = document.querySelector('#examDate');
      if (startEl) startEl.value = x.startDate || '';
      if (examEl && x.examDate) examEl.value = x.examDate;
      setData(x.rows);
      save();
      alert('JSON imported successfully.');
    } catch (e) {
      alert('Invalid JSON backup.');
    }
  };
  r.readAsText(file);
}

async function makeMonthlyPDF() {
  const reportEl = document.querySelector('#reportMonth');
  const key = reportEl ? reportEl.value : "";
  if (!key) { alert('Select a report month first.'); return; }
  const rows = monthRows(key);
  if (!rows.length) { alert('No study data found for this month.'); return; }
  
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const m = monthSummary(key);
  const [y, mo] = key.split('-');
  const name = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18);
  pdf.text(`370R JEE Tracker — Phase ${phaseNumber(key)} — ${name}`, 14, 16);
  pdf.setFontSize(10);
  pdf.text(`Study days: ${m.days}   Lectures: ${m.lec}   Total Questions: ${m.total}   PYQs: ${m.pyq}   Avg Q/day: ${m.days ? Math.round(m.total / m.days) : 0}`, 14, 24);
  pdf.setFontSize(11);
  pdf.text('Subject summary', 14, 34);
  
  const rowsSummary = [
    ['HW / CLASS ILLU', m.phyWork, m.chemWork, m.mathWork, m.phyWork + m.chemWork + m.mathWork],
    ['DPP', 0, m.chemDpp, m.mathDpp, m.chemDpp + m.mathDpp],
    ['PYQ', m.phyPyq, m.chemPyq, m.mathPyq, m.pyq],
    ['TOTAL', m.phy, m.chem, m.math, m.total]
  ];
  
  if (pdf.autoTable) pdf.autoTable({ startY: 38, head: [['TYPE', 'PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'TOTAL']], body: rowsSummary, theme: 'grid' });
  let yy = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : 45;
  pdf.setFontSize(10); pdf.text('Daily log', 14, yy); yy += 5;
  
  const body = rows.map(r => [r.date, r.lec, r.phyWork, r.chemWork, r.mathWork, r.chemDpp, r.mathDpp, r.phyPyq, r.chemPyq, r.mathPyq]);
  if (pdf.autoTable) pdf.autoTable({ startY: yy, head: [['DATE', 'LEC', 'PHY HW/ILLU', 'CHEM HW/ILLU', 'MATH HW/ILLU', 'CHEM DPP', 'MATH DPP', 'PHY PYQ', 'CHEM PYQ', 'MATH PYQ']], body, theme: 'grid', styles: { fontSize: 7 } });
  
  pdf.save(`JEE-Tracker-Phase-${phaseNumber(key)}-${key}.pdf`);
}

async function makePDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  const img = new Image();
  img.src = "tracker-template.png";
  
  try {
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    pdf.addImage(img, "PNG", 0, 0, 210, 297);
  } catch (e) {
    console.warn("Template image not found or blocked. Generating standard PDF layout instead.");
  }

  const sx = 210 / 1086, sy = 297 / 1536;
  const cols = [20, 126, 232, 338, 444, 550, 656, 762, 868, 974, 1080];
  const centers = cols.slice(0, -1).map((x, i) => ((x + cols[i + 1]) / 2) * sx);
  const tableTop = 264, rowH = (1398 - 264) / 15;
  const data = rowsData();

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(20, 20, 20);
  pdf.setFontSize(12);

  data.forEach((r, i) => {
    if (i >= 15) return;
    const y = (tableTop + (i + .5) * rowH) * sy + 1.7;
    const vals = [r.date, r.lec, r.phyWork, r.chemWork, r.mathWork, r.chemDpp, r.mathDpp, r.phyPyq, r.chemPyq, r.mathPyq];
    
    vals.forEach((v, j) => {
      if (v === "" || v == null) return;
      let text = String(v);
      if (j === 0 && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const [yy, mm, dd] = text.split("-"); text = `${dd}/${mm}`;
      }
      const maxChars = j === 0 ? 10 : 6;
      if (text.length > maxChars) text = text.slice(0, maxChars - 1) + "…";
      pdf.text(text, centers[j], y, { align: "center", maxWidth: (cols[j + 1] - cols[j]) * sx - 1 });
    });
  });

  pdf.save("370R-JEE-Advanced-Tracker-Filled.pdf");
}

// 7. Event Listeners Setup
document.addEventListener("DOMContentLoaded", () => {
  const bindClick = (id, fn) => { const el = document.querySelector(id); if (el) el.onclick = fn; };
  
  bindClick("#saveBtn", save);
  bindClick("#loadBtn", load);
  bindClick("#clearBtn", clearAll);
  bindClick("#datesBtn", fillDates);
  bindClick("#addBtn", () => addRows(15));
  bindClick("#pdfBtn", makePDF);
  bindClick("#monthPdfBtn", makeMonthlyPDF);
  bindClick("#jsonExportBtn", exportJSON);
  
  const jsonImport = document.querySelector("#jsonImport");
  if (jsonImport) jsonImport.addEventListener("change", e => { if (e.target.files[0]) importJSON(e.target.files[0]); });
  
  const examDateEl = document.querySelector("#examDate");
  if (examDateEl) examDateEl.addEventListener("change", () => { updateCountdown(); save(); });

  setInterval(updateCountdown, 60000);

  // Initialize
  makeRows();
  const saved = migrateData();
  if (saved) {
    const startEl = document.querySelector("#startDate");
    const examEl = document.querySelector("#examDate");
    if (startEl) startEl.value = saved.startDate || "";
    if (examEl) examEl.value = saved.examDate || examEl.value;
    setData(saved.rows);
  }
  updateCountdown();
  updateStats();
});
    

  async function makePDF() {
  const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDFLib) {
    alert("PDF library missing h! Index.html me script tags check kr.");
    return;
  }

  const pdf = new jsPDFLib({ orientation: "portrait", unit: "mm", format: "a4" });

  // 1. Title Block
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("370R JEE ADVANCED TRACKER", 14, 12);
  pdf.setFontSize(8);
  pdf.text("15-DAY QUESTION & LECTURE LOG", 14, 16);

  // 2. Yellow Headers (14 Columns)
  const headers = [[
    "DATE", "LEC",
    "PHY HW", "PHY ILLU",
    "CHEM HW", "CHEM ILLU",
    "MATH HW", "MATH ILLU",
    "PHY DPP", "CHEM DPP", "MATH DPP",
    "PHY PYQ", "CHEM PYQ", "MATH PYQ"
  ]];

  // 3. Extract 15 Rows
  const rows = [...tbody.children].slice(0, 15).map(tr => {
    const getVal = f => {
      const inp = tr.querySelector(`[data-f="${f}"]`);
      return inp ? inp.value : "";
    };

    return [
      getVal("date"),
      getVal("lec"),
      getVal("phyWork"), "",
      getVal("chemWork"), "",
      getVal("mathWork"), "",
      getVal("phyDpp"),
      getVal("chemDpp"),
      getVal("mathDpp"),
      getVal("phyPyq"),
      getVal("chemPyq"),
      getVal("mathPyq")
    ];
  });

  // 4. Totals Calculation
  const data = rowsData().slice(0, 15);
  const totalLec = sumField(data, "lec");
  const pWork = sumField(data, "phyWork"), cWork = sumField(data, "chemWork"), mWork = sumField(data, "mathWork");
  const pDpp = sumField(data, "phyDpp"), cDpp = sumField(data, "chemDpp"), mDpp = sumField(data, "mathDpp");
  const pPyq = sumField(data, "phyPyq"), cPyq = sumField(data, "chemPyq"), mPyq = sumField(data, "mathPyq");

  const totalPyqs = pPyq + cPyq + mPyq;
  const totalQs = pWork + cWork + mWork + pDpp + cDpp + mDpp + totalPyqs;

  // 5. Single AutoTable (Foot option se exact column width lock ho jayegi)
  pdf.autoTable({
    startY: 19,
    head: headers,
    body: rows,
    foot: [[
      "TOTAL",
      totalLec || "",
      pWork || 0, 0,
      cWork || 0, 0,
      mWork || 0, 0,
      pDpp || 0, cDpp || 0, mDpp || 0,
      pPyq || 0, cPyq || 0, mPyq || 0
    ]],
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
      textColor: 0,
      lineColor: 150,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [250, 204, 21], // Yellow Header
      textColor: 0,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [255, 255, 255], // White background for TOTAL row
      textColor: 0,
      fontStyle: 'bold',
      lineColor: 150,
      lineWidth: 0.1
    }
  });

  // 6. Footer Text Summary
  const footerY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 6 : 190;
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Total questions: ${totalQs}`, 14, footerY);
  pdf.text(`Total lectures: ${totalLec}   |   Total PYQs: ${totalPyqs}`, 14, footerY + 4);

  // Download Output
  pdf.save("15DAY-REPORT-JEE-Advanced.pdf");
  }
function updateDashboard(selectedDateData) {
  let questionsToday = 0;
  let lecturesToday = 0;

  if (selectedDateData) {
    // Sum questions for the selected day
    const hw = Number(selectedDateData.hw) || 0;
    const dpp = Number(selectedDateData.dpp) || 0;
    const pyq = Number(selectedDateData.pyq) || 0;
    
    questionsToday = hw + dpp + pyq;

    // Get lectures for the selected day (change .lectures if your key name is different)
    lecturesToday = Number(selectedDateData.lectures) || 0;
  }

  // Render values to the UI
  document.getElementById('questions-today').textContent = questionsToday;
  document.getElementById('lectures-today').textContent = lecturesToday;
}



/* =========================================================
   MENU + 29 THEMES + DAILY TODO + FOCUS MODE
   These features use separate localStorage keys and do not
   alter the existing tracker data.
   ========================================================= */

const THEME_KEY = "jee370rThemeV2";
const TODO_KEY = "jee370rDailyTodoV1";
const FOCUS_KEY = "jee370rFocusLogsV1";

function localISODate(d = new Date()) {
  const x = new Date(d);
  const offset = x.getTimezoneOffset();
  return new Date(x.getTime() - offset * 60000).toISOString().slice(0,10);
}
function put(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function safeJSON(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? fallback;
  } catch(e) { return fallback; }
}
function escapeFeatureText(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

/* ---------- Feature menu ---------- */
function openFeature(name) {
  const overlay = document.getElementById("featureOverlay");
  const title = document.getElementById("featurePageTitle");
  const views = ["menu","syllabus","themes","todo","focus","weekly","backup"];
  const titles = {menu:"Menu",syllabus:"📚 Syllabus Tracker",themes:"🎨 Themes",todo:"📝 Daily TODO",focus:"⏱️ Focus Mode",weekly:"📊 Weekly Report",backup:"💾 Backup & Import"};
  overlay.hidden = false;
  views.forEach(v => {
    const el = document.getElementById(v + "View");
    if (el) el.hidden = v !== name;
  });
  title.textContent = titles[name] || "Menu";
  if (name === "themes") updateThemeButtons();
  if (name === "todo") renderTodoList();
  if (name === "focus") renderFocus();
  if (name === "weekly") renderWeeklyReport();
}
function closeFeature() {
  const overlay = document.getElementById("featureOverlay");
  if (overlay) overlay.hidden = true;
}
function initFeatureMenu() {
  // Use document-level delegation so the controls keep working even if the
  // original tracker script rebinds other buttons later.
  document.addEventListener("click", e => {
    const themeBtn = e.target.closest("#topThemeBtn");
    const menuBtn = e.target.closest("#topMenuBtn");
    const closeBtn = e.target.closest("#featureClose");
    const featureBtn = e.target.closest("[data-open-feature]");
    if (themeBtn) { e.preventDefault(); e.stopPropagation(); openFeature("themes"); return; }
    if (menuBtn) { e.preventDefault(); e.stopPropagation(); openFeature("menu"); return; }
    if (closeBtn) { e.preventDefault(); e.stopPropagation(); closeFeature(); return; }
    if (featureBtn) { e.preventDefault(); e.stopPropagation(); openFeature(featureBtn.dataset.openFeature); return; }
    if (e.target.id === "featureOverlay") closeFeature();
  }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeFeature(); });
}

/* ---------- 48 themes ---------- */
const THEMES = [
  "classic","peach","pink","lavender","mint","ocean","rose-dark","forest",
  "sky","sunset","coral","lemon","aqua","teal","indigo","violet","plum",
  "berry","cherry","coffee","sand","slate","midnight","neon","aurora","ember",
  "grape","ice","amoled","dracula","tokyo-night","nord-dark","solar-dark",
  "deep-ocean","cyberpunk","synthwave","matrix","crimson","royal-dark","obsidian",
  "charcoal","cosmic","toxic","blueberry-dark","cocoa-dark","rosewood","teal-night","gold-night"
];

function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = "royal-dark";
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  updateThemeButtons();
}
function updateThemeButtons() {
  const theme = document.body.dataset.theme || "royal-dark";
  document.querySelectorAll(".theme-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}
function initThemes() {
  applyTheme(localStorage.getItem(THEME_KEY) || "royal-dark");
  document.querySelectorAll(".theme-option").forEach(btn => {
    btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
  });
}

/* ---------- Daily TODO ---------- */
function getTodos() { return safeJSON(TODO_KEY, []); }
function saveTodos(data) { localStorage.setItem(TODO_KEY, JSON.stringify(data)); }

function todoStats(date) {
  const all = getTodos();
  const daily = date ? all.filter(t => t.date === date) : all;
  const total = daily.length;
  const completed = daily.filter(t => t.completed).length;
  return {all,daily,total,completed,pending:total-completed,rate:total ? Math.round(completed/total*100) : 0};
}
function renderTodoList() {
  const filter = document.getElementById("todoFilterDate");
  const list = document.getElementById("todoList");
  if (!filter || !list) return;
  const date = filter.value || localISODate();
  const s = todoStats(date);
  put("todoTotal",s.total); put("todoCompleted",s.completed);
  put("todoPending",s.pending); put("todoRate",s.rate+"%");
  if (!s.daily.length) {
    list.innerHTML = '<div class="todo-empty">No tasks for this date. Add your first task ✨</div>';
    return;
  }
  list.innerHTML = s.daily.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).map(t => `
    <div class="todo-item ${t.completed ? "done" : ""}">
      <input class="todo-check" type="checkbox" ${t.completed?"checked":""} data-todo-check="${t.id}">
      <div class="todo-item-main">
        <div class="todo-item-title">${escapeFeatureText(t.task)}</div>
        <div class="todo-item-meta"><span class="todo-tag">${escapeFeatureText(t.category)}</span><span>${t.date}</span></div>
      </div>
      <button class="todo-delete" data-todo-delete="${t.id}">🗑️</button>
    </div>`).join("");

  list.querySelectorAll("[data-todo-check]").forEach(box => box.addEventListener("change", () => {
    const todos=getTodos(), item=todos.find(t=>String(t.id)===String(box.dataset.todoCheck));
    if(item){item.completed=box.checked;saveTodos(todos);renderTodoList();}
  }));
  list.querySelectorAll("[data-todo-delete]").forEach(btn => btn.addEventListener("click", () => {
    saveTodos(getTodos().filter(t=>String(t.id)!==String(btn.dataset.todoDelete)));
    renderTodoList();
  }));
}
function addTodo() {
  const date=document.getElementById("todoDate")?.value || localISODate();
  const task=document.getElementById("todoTask")?.value.trim() || "";
  const category=document.getElementById("todoCategory")?.value || "Other";
  if(!task){alert("Task likho pehle.");return;}
  const todos=getTodos();
  todos.push({id:Date.now()+Math.random(),date,task,category,completed:false,createdAt:Date.now()});
  saveTodos(todos);
  document.getElementById("todoFilterDate").value=date;
  document.getElementById("todoTask").value="";
  renderTodoList();
}
function downloadTodoPDF() {
  const jsPDFLib=window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if(!jsPDFLib){alert("PDF library missing.");return;}
  const date=document.getElementById("todoFilterDate")?.value || localISODate();
  const s=todoStats(date);
  if(!s.daily.length){alert("Is date ke liye koi TODO task nahi hai.");return;}
  const pdf=new jsPDFLib({orientation:"portrait",unit:"mm",format:"a4"});
  pdf.setFont("helvetica","bold");pdf.setFontSize(18);
  pdf.text("370R JEE Tracker — Daily TODO",14,16);
  pdf.setFontSize(11);pdf.text(date,14,23);
  pdf.setFontSize(10);pdf.text(`Total: ${s.total}   Completed: ${s.completed}   Pending: ${s.pending}   Completion: ${s.rate}%`,14,31);
  let y=38;
  const body=s.daily.map((t,i)=>[i+1,t.completed?"DONE":"PENDING",t.category,t.task]);
  if(pdf.autoTable) pdf.autoTable({startY:y,head:[["#","STATUS","CATEGORY","TASK"]],body,theme:"grid",styles:{fontSize:8}});
  pdf.save(`370R-Daily-TODO-${date}.pdf`);
}
function initTodo() {
  const today=localISODate();
  const d=document.getElementById("todoDate"), f=document.getElementById("todoFilterDate");
  if(d)d.value=today;if(f)f.value=today;
  document.getElementById("addTodoBtn")?.addEventListener("click",addTodo);
  document.getElementById("todoTask")?.addEventListener("keydown",e=>{if(e.key==="Enter")addTodo();});
  f?.addEventListener("change",renderTodoList);
  document.getElementById("todayTodoBtn")?.addEventListener("click",()=>{if(d)d.value=today;if(f)f.value=today;renderTodoList();});
  document.getElementById("todoPdfBtn")?.addEventListener("click",downloadTodoPDF);
}

/* ---------- Focus Mode ---------- */
let focusTimer=null, focusSeconds=0, focusRunning=false, focusStartedAt=null;
function getFocusLogs(){return safeJSON(FOCUS_KEY,[]);}
function saveFocusLogs(x){localStorage.setItem(FOCUS_KEY,JSON.stringify(x));}
function formatHMS(sec){
  sec=Math.max(0,Math.floor(sec));
  const h=String(Math.floor(sec/3600)).padStart(2,"0");
  const m=String(Math.floor(sec%3600/60)).padStart(2,"0");
  const s=String(sec%60).padStart(2,"0");
  return `${h}:${m}:${s}`;
}
function formatMinutes(min){min=Math.round(min);return min>=60?`${Math.floor(min/60)}h ${min%60}m`:`${min}m`;}
function updateFocusClock(){put("focusClock",formatHMS(focusSeconds));}
function startFocus(){
  if(focusRunning)return;
  focusRunning=true;
  if(!focusStartedAt)focusStartedAt=Date.now()-focusSeconds*1000;
  focusTimer=setInterval(()=>{focusSeconds=Math.floor((Date.now()-focusStartedAt)/1000);updateFocusClock();},1000);
}
function pauseFocus(){focusRunning=false;clearInterval(focusTimer);focusTimer=null;}
function resetFocus(){pauseFocus();focusSeconds=0;focusStartedAt=null;updateFocusClock();}
function saveFocusLog(){
  const minutes=Math.round(focusSeconds/60);
  if(minutes<1){alert("At least 1 minute ka focus log save karo.");return;}
  const logs=getFocusLogs();
  logs.push({
    id:Date.now()+Math.random(),date:localISODate(),minutes,
    subject:document.getElementById("focusSubject").value,
    activity:document.getElementById("focusActivity").value,
    questions:Number(document.getElementById("focusQuestions").value)||0,
    note:document.getElementById("focusNote").value.trim(),
    createdAt:Date.now()
  });
  saveFocusLogs(logs);resetFocus();renderFocus();
}
function saveManualFocusLog(e){
  if(e){e.preventDefault();e.stopPropagation();}
  const minutesEl=document.getElementById("focusManualMinutes");
  const dateEl=document.getElementById("focusManualDate");
  const minutes=parseInt(minutesEl?.value,10);
  if(!Number.isFinite(minutes) || minutes<1){
    alert("Manual focus time me 1 ya usse zyada minutes enter karo.");
    minutesEl?.focus();
    return false;
  }
  const date=dateEl?.value || localISODate();
  const subject=document.getElementById("focusSubject")?.value || "Other";
  const activity=document.getElementById("focusActivity")?.value || "Other";
  const questions=parseInt(document.getElementById("focusQuestions")?.value,10)||0;
  const note=document.getElementById("focusNote")?.value.trim() || "Manual time";
  const logs=getFocusLogs();
  logs.push({id:Date.now()+Math.random(),date,minutes,subject,activity,questions,note,createdAt:Date.now(),manual:true});
  saveFocusLogs(logs);
  if(minutesEl) minutesEl.value="";
  if(document.getElementById("focusFilterDate")) document.getElementById("focusFilterDate").value=date;
  renderFocus();
  if(!document.getElementById("weeklyView")?.hidden) renderWeeklyReport();
  alert(`✅ ${formatMinutes(minutes)} focus time saved for ${date}.`);
  return false;
}
window.saveManualFocusLog=saveManualFocusLog;

function weekDates(end){
  const d=new Date(end+"T00:00:00");
  const out=[];
  for(let i=6;i>=0;i--){
    const x=new Date(d);x.setDate(d.getDate()-i);
    out.push(x.toISOString().slice(0,10));
  }
  return out;
}
function drawWeeklyChart(id, labels, values, suffix=""){
  const box=document.getElementById(id); if(!box)return;
  const max=Math.max(1,...values.map(v=>Number(v)||0));
  box.innerHTML=values.map((value,i)=>{
    const v=Number(value)||0;
    const pct=Math.max(0,Math.min(100,(v/max)*100));
    return `<div class="weekly-bar-col">
      <div class="weekly-bar-value">${escapeFeatureText(String(v)+suffix)}</div>
      <div class="weekly-bar-track"><div class="weekly-bar-fill" style="height:${pct}%"></div></div>
      <div class="weekly-bar-label">${escapeFeatureText(labels[i])}</div>
    </div>`;
  }).join("");
}

function renderWeeklyReport(){
  const input=document.getElementById("weeklyEndDate");
  if(!input)return;
  const end=input.value||localISODate();
  const dates=weekDates(end), rows=rowsData(), logs=getFocusLogs(), todos=getTodos();
  const questions=dates.map(date=>rows.filter(r=>r.date===date).reduce((sum,r)=>sum+num(r.phyWork)+num(r.chemWork)+num(r.mathWork)+num(r.phyDpp)+num(r.chemDpp)+num(r.mathDpp)+num(r.phyPyq)+num(r.chemPyq)+num(r.mathPyq),0));
  const lectures=dates.map(date=>rows.filter(r=>r.date===date).reduce((sum,r)=>sum+num(r.lec),0));
  const focus=dates.map(date=>logs.filter(x=>x.date===date).reduce((sum,x)=>sum+(Number(x.minutes)||0),0));
  const weekTodos=todos.filter(x=>dates.includes(x.date));
  const done=weekTodos.filter(x=>x.completed).length;
  put("weeklyQuestions",questions.reduce((a,b)=>a+b,0));
  put("weeklyLectures",lectures.reduce((a,b)=>a+b,0));
  put("weeklyFocus",formatMinutes(focus.reduce((a,b)=>a+b,0)));
  put("weeklyTasks",(weekTodos.length?Math.round(done/weekTodos.length*100):0)+"%");
  const labels=dates.map(d=>new Date(d+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short"}));
  drawWeeklyChart("weeklyQuestionsChart",labels,questions);
  drawWeeklyChart("weeklyLecturesChart",labels,lectures);
  drawWeeklyChart("weeklyFocusChart",labels,focus,"m");
}

function renderFocus(){
  const date=document.getElementById("focusFilterDate")?.value || localISODate();
  const logs=getFocusLogs(), daily=logs.filter(x=>x.date===date);
  const today=logs.filter(x=>x.date===localISODate());
  const mins=arr=>arr.reduce((a,x)=>a+(Number(x.minutes)||0),0);
  put("focusTodayMinutes",formatMinutes(mins(today)));
  put("focusTodayQuestions",today.reduce((a,x)=>a+(Number(x.questions)||0),0));
  put("focusTotalMinutes",formatMinutes(mins(logs)));
  put("focusLogCount",logs.length);
  const list=document.getElementById("focusList"); if(!list)return;
  if(!daily.length){list.innerHTML='<div class="todo-empty">No focus logs for this date.</div>';return;}
  list.innerHTML=daily.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).map(x=>`
    <div class="todo-item focus-item">
      <div class="todo-item-main">
        <div class="todo-item-title">${escapeFeatureText(x.subject)} · ${escapeFeatureText(x.activity)} · ${formatMinutes(x.minutes)}</div>
        <div class="todo-item-meta"><span class="todo-tag">${x.questions||0} questions</span><span>${escapeFeatureText(x.note||"")}</span></div>
      </div>
      <button class="todo-delete" data-focus-delete="${x.id}">🗑️</button>
    </div>`).join("");
  list.querySelectorAll("[data-focus-delete]").forEach(btn=>btn.addEventListener("click",()=>{
    saveFocusLogs(getFocusLogs().filter(x=>String(x.id)!==String(btn.dataset.focusDelete)));renderFocus();
  }));
}
function downloadFocusPDF(){
  const jsPDFLib=window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if(!jsPDFLib){alert("PDF library missing.");return;}
  const date=document.getElementById("focusFilterDate")?.value || localISODate();
  const logs=getFocusLogs().filter(x=>x.date===date);
  if(!logs.length){alert("Is date ke liye koi focus log nahi hai.");return;}
  const total=logs.reduce((a,x)=>a+x.minutes,0), qs=logs.reduce((a,x)=>a+x.questions,0);
  const pdf=new jsPDFLib({orientation:"portrait",unit:"mm",format:"a4"});
  pdf.setFont("helvetica","bold");pdf.setFontSize(18);pdf.text("370R JEE Tracker — Focus Report",14,16);
  pdf.setFontSize(11);pdf.text(`${date}  •  Focus: ${formatMinutes(total)}  •  Questions: ${qs}`,14,24);
  const body=logs.map((x,i)=>[i+1,x.subject,x.activity,formatMinutes(x.minutes),x.questions,x.note||""]);
  if(pdf.autoTable)pdf.autoTable({startY:32,head:[["#","SUBJECT","ACTIVITY","TIME","Q","NOTE"]],body,theme:"grid",styles:{fontSize:8}});
  pdf.save(`370R-Focus-${date}.pdf`);
}
function initFocus(){
  const f=document.getElementById("focusFilterDate");if(f)f.value=localISODate();
  document.getElementById("focusStartBtn")?.addEventListener("click",startFocus);
  document.getElementById("focusPauseBtn")?.addEventListener("click",pauseFocus);
  document.getElementById("focusResetBtn")?.addEventListener("click",resetFocus);
  document.getElementById("focusSaveBtn")?.addEventListener("click",saveFocusLog);
  const manualBtn=document.getElementById("focusManualSaveBtn");
  if(manualBtn){
    manualBtn.onclick=saveManualFocusLog;
  }
  const md=document.getElementById("focusManualDate"); if(md)md.value=localISODate();
  document.getElementById("focusPdfBtn")?.addEventListener("click",downloadFocusPDF);
  f?.addEventListener("change",renderFocus);
  updateFocusClock();
}

function initWeeklyReport(){
  const d=document.getElementById("weeklyEndDate");
  if(d)d.value=localISODate();
  document.getElementById("weeklyThisWeekBtn")?.addEventListener("click",()=>{if(d)d.value=localISODate();renderWeeklyReport();});
  d?.addEventListener("change",renderWeeklyReport);
  window.addEventListener("resize",()=>{if(!document.getElementById("weeklyView")?.hidden)renderWeeklyReport();});
}

/* ---------- Syllabus Tracker: configurable chapters + A4 printable sheet ---------- */
const SYLLABUS_KEY = "370R_JEE_SYLLABUS_V3";
const SYLLABUS_SUBJECTS = ["Physics", "Chemistry", "Mathematics"];
const SYLLABUS_TASKS = ["jm", "adv", "mbbs", "opp", "hw", "module", "pyq", "advProb", "r1", "r2", "r3"];
const SYLLABUS_TASK_LABELS = {jm:"MAINS LEVEL", adv:"ADV LEVEL", mbbs:"SHORT NOTES", opp:"DPP", hw:"HW", module:"MODULE", pyq:"PYQ", advProb:"TEST", r1:"R1", r2:"R2", r3:"R3"};

function syllabusData(){
  try{
    const raw = localStorage.getItem(SYLLABUS_KEY) || localStorage.getItem("370R_JEE_SYLLABUS_V2") || localStorage.getItem("370R_JEE_SYLLABUS_V1");
    const x = raw ? JSON.parse(raw) : {chapters:[]};
    const chapters = Array.isArray(x.chapters) ? x.chapters : [];
    return {version:3, chapters:chapters.map(c=>({
      id:String(c.id || ("ch_"+Date.now()+Math.random().toString(36).slice(2))),
      subject:SYLLABUS_SUBJECTS.includes(c.subject) ? c.subject : "Physics",
      name:String(c.name||"").trim(),
      total:Math.max(1,Math.min(100,parseInt(c.total,10)||1))
    })).filter(c=>c.name)};
  }catch(e){ return {version:3,chapters:[]}; }
}
function saveSyllabusData(d){ localStorage.setItem(SYLLABUS_KEY, JSON.stringify(d)); }
function renderSyllabus(){
  const list=document.getElementById("syllabusList"); if(!list)return;
  const d=syllabusData();
  if(!d.chapters.length){ list.innerHTML='<div class="sy-empty">No chapters yet. Add your first chapter above.</div>'; return; }
  const esc=s=>escapeFeatureText(s);
  list.innerHTML=SYLLABUS_SUBJECTS.map(subject=>{
    const rows=d.chapters.filter(c=>c.subject===subject); if(!rows.length)return "";
    return `<section class="sy-subject"><div class="sy-subject-head"><h3>${esc(subject)}</h3><span>${rows.length} chapter${rows.length>1?'s':''}</span></div><div class="sy-simple-table-wrap"><table class="sy-simple-table"><thead><tr><th>#</th><th>Chapter Name</th><th>Total Lectures</th><th>Action</th></tr></thead><tbody>${rows.map((c,i)=>`<tr><td>${i+1}</td><td>${esc(c.name)}</td><td>${c.total}</td><td><button class="sy-delete" data-sy-delete="${esc(c.id)}" type="button">Delete</button></td></tr>`).join("")}</tbody></table></div></section>`;
  }).join("");
}
function addSyllabusChapter(){
  const subject=document.getElementById("syllabusSubject")?.value;
  const name=document.getElementById("syllabusChapterName")?.value.trim();
  const total=Number(document.getElementById("syllabusTotalLectures")?.value);
  if(!SYLLABUS_SUBJECTS.includes(subject) || !name || !Number.isInteger(total) || total<1 || total>100){
    alert("Subject, Chapter Name aur Total Lectures (1–100) sahi se bharo."); return;
  }
  const d=syllabusData();
  d.chapters.push({id:"ch_"+Date.now()+"_"+Math.random().toString(36).slice(2),subject,name,total});
  saveSyllabusData(d); renderSyllabus();
  document.getElementById("syllabusChapterName").value="";
  document.getElementById("syllabusTotalLectures").value="";
  document.getElementById("syllabusChapterName").focus();
}
function initSyllabus(){
  document.getElementById("syllabusAddBtn")?.addEventListener("click",addSyllabusChapter);
  document.getElementById("syllabusChapterName")?.addEventListener("keydown",e=>{if(e.key==="Enter")addSyllabusChapter();});
  document.getElementById("syllabusList")?.addEventListener("click",e=>{
    const b=e.target.closest("[data-sy-delete]"); if(!b)return;
    const id=b.dataset.syDelete, d=syllabusData(), c=d.chapters.find(x=>x.id===id); if(!c)return;
    if(confirm(`Delete “${c.name}”?`)){d.chapters=d.chapters.filter(x=>x.id!==id);saveSyllabusData(d);renderSyllabus();}
  });
  document.getElementById("syllabusClearBtn")?.addEventListener("click",()=>{
    if(!syllabusData().chapters.length)return;
    if(confirm("Clear the complete syllabus?")){saveSyllabusData({version:3,chapters:[]});renderSyllabus();}
  });
  document.getElementById("syllabusBackBtn")?.addEventListener("click",()=>openFeature("menu"));
  document.getElementById("syllabusPdfBtn")?.addEventListener("click",downloadSyllabusPDF);
  renderSyllabus();
}
function pdfBox(pdf,x,y,size=3.4){ pdf.setDrawColor(80,80,80); pdf.setLineWidth(0.25); pdf.rect(x,y,size,size); }
function downloadSyllabusPDF(){
  const JsPDF=window.jspdf?.jsPDF || window.jsPDF;
  if(!JsPDF){alert("PDF library load nahi hui. Internet on karke page reload karo.");return;}
  const d=syllabusData();
  if(!d.chapters.length){alert("Pehle chapters add karo.");return;}

  // Large syllabuses used to make one very heavy autoTable call. On phones
  // that could stall jsPDF before the browser got a chance to download it.
  // Build the PDF in small page-sized chunks instead.
  const pdf=new JsPDF({orientation:"landscape",unit:"mm",format:"a4",compress:true});
  const M=7, usable=297-14;
  const headers=["#","Chapter Name","Lecture Tracker","Total Lec","Lec Comp",...SYLLABUS_TASKS.map(k=>SYLLABUS_TASK_LABELS[k])];
  const widths=[7,55,60,14,10,...SYLLABUS_TASKS.map(()=>12)];

  let firstPage=true;

  function drawPage(subject, chapters, startIndex){
    if(!firstPage) pdf.addPage();
    firstPage=false;

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(15);
    pdf.setTextColor(25,25,25);
    pdf.text("JEE SYLLABUS TRACKER",M,9);

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(6.5);
    pdf.text("Offline Printable • Tick everything by hand",M,13);

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(10.5);
    pdf.text(subject.toUpperCase(),M,19);

    const rows=chapters.map((c,i)=>[
      String(startIndex+i+1), c.name, "", String(c.total), "",
      ...SYLLABUS_TASKS.map(()=> "")
    ]);

    pdf.autoTable({
      startY:22,
      margin:{left:M,right:M,top:6,bottom:7},
      tableWidth:usable,
      head:[headers],
      body:rows,
      theme:"grid",
      rowPageBreak:"avoid",
      styles:{
        font:"helvetica",fontSize:6.4,cellPadding:1.2,overflow:"linebreak",
        valign:"middle",halign:"center",lineWidth:0.18,
        lineColor:[145,145,145],textColor:[30,30,30]
      },
      headStyles:{
        fontStyle:"bold",fontSize:6.2,halign:"center",valign:"middle",
        fillColor:[235,235,235],textColor:[25,25,25],cellPadding:1.2
      },
      columnStyles:Object.fromEntries(
        widths.map((w,i)=>[
          i,{cellWidth:w,halign:i===1?"left":"center",
          fontSize:i===1?10:(i===3?8:6.4),fontStyle:i===1||i===3?"bold":"normal"}
        ])
      ),
      didParseCell:data=>{
        if(data.section==="body" && data.column.index===2){
          const total=chapters[data.row.index].total;
          const lines=Math.ceil(total/5);
          data.cell.styles.minCellHeight=Math.max(8,lines*7.0+1.5);
        }
      },
      didDrawCell:data=>{
        if(data.section!=="body")return;

        if(data.column.index===2){
          const total=chapters[data.row.index].total;
          const perLine=5, box=4.0, step=11.0, lineH=7.0;

          for(let n=0;n<total;n++){
            const line=Math.floor(n/perLine), pos=n%perLine;
            const x=data.cell.x+2.0+pos*step;
            const y=data.cell.y+1.0+line*lineH;
            if(y+box>data.cell.y+data.cell.height-0.3)continue;

            pdfBox(pdf,x,y,box);
            pdf.setFont("helvetica","normal");
            pdf.setFontSize(5.2);
            pdf.setTextColor(55,55,55);
            pdf.text(String(n+1),x+5.2,y+3.0);
          }
        }

        if(data.column.index>=5){
          const box=4.0;
          pdfBox(
            pdf,
            data.cell.x+(data.cell.width-box)/2,
            data.cell.y+(data.cell.height-box)/2,
            box
          );
        }
      }
    });
  }

  try{
    // Keep each autoTable call comfortably within one A4 page's worth of rows.
    // A chapter with up to 100 lectures still fits as a single row.
    const MAX_BODY_HEIGHT=255;

    for(const subject of SYLLABUS_SUBJECTS){
      const chapters=d.chapters.filter(c=>c.subject===subject);
      if(!chapters.length) continue;

      let chunk=[];
      let used=0;
      let startIndex=0;

      chapters.forEach((chapter,index)=>{
        const h=Math.max(8,Math.ceil(chapter.total/5)*7.0+1.5);

        // Flush before adding another large row.
        if(chunk.length && used+h>MAX_BODY_HEIGHT){
          drawPage(subject,chunk,startIndex);
          startIndex=index;
          chunk=[];
          used=0;
        }

        chunk.push(chapter);
        used+=h;

        if(index===chapters.length-1 && chunk.length){
          drawPage(subject,chunk,startIndex);
        }
      });
    }

    pdf.save("JEE-Syllabus-Tracker-A4-Landscape.pdf");
  }catch(e){
    console.error("Syllabus PDF generation failed:",e);
    alert("PDF generate nahi ho paaya. Data safe hai — chapters/lectures delete nahi hue. Page reload karke dobara try karo.");
  }
}

/* ---------- Start ---------- */
document.addEventListener("DOMContentLoaded",()=>{
  initFeatureMenu();
  initSyllabus();
  initThemes();
  initTodo();
  initFocus();
  initWeeklyReport();
  initBackup();
});

/* ---------- Full JSON backup / import ---------- */
const BACKUP_VERSION = 1;

function collectAllBackupData(){
  const data = {};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(!key) continue;
    try{
      data[key]=JSON.parse(localStorage.getItem(key));
    }catch(e){
      data[key]=localStorage.getItem(key);
    }
  }
  return {
    app:"370R JEE Tracker",
    backupVersion:BACKUP_VERSION,
    exportedAt:new Date().toISOString(),
    localStorage:data
  };
}

function exportAllJson(){
  const backup=collectAllBackupData();
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  const stamp=new Date().toISOString().replace(/[:.]/g,"-");
  a.download=`370R-JEE-Tracker-Backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  const s=document.getElementById("backupStatus");
  if(s)s.textContent="✅ Full JSON backup downloaded successfully.";
}

function importAllJson(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const backup=JSON.parse(reader.result);
      if(!backup || typeof backup!=="object" || !backup.localStorage || typeof backup.localStorage!=="object"){
        throw new Error("Invalid backup format");
      }

      const confirmed=confirm(
        "Import this backup?\\n\\nThis will replace the current saved tracker data on this browser with the backup data."
      );
      if(!confirmed)return;

      Object.keys(backup.localStorage).forEach(key=>{
        const value=backup.localStorage[key];
        localStorage.setItem(key,typeof value==="string"?value:JSON.stringify(value));
      });

      const s=document.getElementById("backupStatus");
      if(s)s.textContent="✅ Backup imported. Reloading tracker...";
      setTimeout(()=>location.reload(),500);
    }catch(e){
      const s=document.getElementById("backupStatus");
      if(s)s.textContent="❌ Invalid JSON backup. Nothing was changed.";
      console.error(e);
    }
  };
  reader.readAsText(file);
}

function initBackup(){
  document.getElementById("exportJsonBtn")?.addEventListener("click",exportAllJson);
  document.getElementById("importJsonInput")?.addEventListener("change",e=>{
    importAllJson(e.target.files?.[0]);
    e.target.value="";
  });
}
