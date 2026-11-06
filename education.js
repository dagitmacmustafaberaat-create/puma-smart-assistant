let educationCalendar = [];

const NOVEMBER_TRAINING = {
  vm: {
    label: "VM / SATIŞ",
    topics: ["VM Kuralları", "Satış Teknikleri"],
    files: ["vmkuralları.docx", "satısteknikleri.pptx"]
  },
  tech: {
    label: "TEKNOLOJİ",
    topics: ["Ürün ve teknoloji eğitimi"],
    files: ["egitim.pdf"]
  },
  practice: {
    label: "UYGULAMA",
    topics: ["Perakende Matematiği", "BACK TO BE NICE"],
    files: ["perakendematematigi.pdf", "BACK TO BE NICE.pdf"]
  }
};

const NOVEMBER_TRAINING_DATES = {
  "2026-11-09": "vm", "2026-11-10": "tech", "2026-11-11": "practice",
  "2026-11-16": "vm", "2026-11-17": "tech", "2026-11-18": "practice",
  "2026-11-23": "vm", "2026-11-24": "tech", "2026-11-25": "practice",
  "2026-11-30": "vm"
};

function showEducationCenter() {
  ["productSearchArea", "sizeSearchArea", "dailyTasksArea", "vmStandardsArea"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const area = document.getElementById("educationArea");
  const menu = document.getElementById("mainMenu");
  if (menu) menu.style.display = "none";
  if (area) area.style.display = "block";
  loadEducationCalendar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadEducationCalendar() {
  educationCalendar = [];
  for (let day = 1; day <= 30; day++) {
    const date = "2026-11-" + String(day).padStart(2, "0");
    const d = new Date(2026, 10, day);
    const kind = NOVEMBER_TRAINING_DATES[date] || "";
    const weekday = d.toLocaleDateString("tr-TR", { weekday: "long" });
    educationCalendar.push({
      date: date,
      weekday: weekday.charAt(0).toLocaleUpperCase("tr-TR") + weekday.slice(1),
      kind: kind,
      training: kind ? NOVEMBER_TRAINING[kind] : null
    });
  }
  renderEducationCalendar();
}

function openTrainingResource(file) {
  const paths = {
    "vmkuralları.docx": "./vmkurallar%C4%B1.docx",
    "satısteknikleri.pptx": "./sat%C4%B1steknikleri.pptx",
    "egitim.pdf": "./egitim.pdf",
    "perakendematematigi.pdf": "./perakendematematigi.pdf",
    "BACK TO BE NICE.pdf": "./BACK%20TO%20BE%20NICE.pdf"
  };
  if (paths[file]) window.open(paths[file], "_blank", "noopener");
}

function renderTrainingLinks(training) {
  if (!training) return '<span class="training-empty">Bu tarihte planlı eğitim yok</span>';
  return training.files.map(function (file, index) {
    const title = training.topics[index] || file;
    return '<button type="button" class="calendar-topic" onclick="openTrainingResource(\'' +
      file.replace(/\\/g, "\\\\").replace(/'/g, "\\'") +
      '\')"><span>' + training.label + '</span><strong>' + title +
      '</strong><small>İçeriği aç ↗</small></button>';
  }).join("");
}

function renderEducationCalendar() {
  const now = new Date();
  const today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const current = educationCalendar.find(function (item) { return item.date === today && item.training; }) ||
    educationCalendar.find(function (item) { return item.date > today && item.training; });
  const todayBox = document.getElementById("todayTraining");
  const calendarBox = document.getElementById("educationCalendar");
  const safe = function (value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  if (todayBox) {
    todayBox.innerHTML = current ? `
      <div class="today-topline"><span class="today-dot"></span> ${current.date === today ? "BUGÜNÜN EĞİTİMİ" : "SIRADAKİ EĞİTİM"}</div>
      <div class="today-date">${safe(current.weekday)} • ${current.date.split("-").reverse().join(".")}</div>
      <div class="today-topic-grid">${renderTrainingLinks(current.training)}</div>` :
      '<div class="today-topline">KASIM EĞİTİM TAKVİMİ</div><p class="outside-calendar">Kasım ayındaki planlı eğitimler tamamlandı.</p>';
  }

  const rangeLabel = document.getElementById("educationCalendarRange");
  if (rangeLabel) rangeLabel.textContent = "Kasım 2026";

  if (calendarBox) {
    calendarBox.innerHTML = educationCalendar.map(function (item) {
      const isToday = item.date === today;
      const dateLabel = item.date.split("-").reverse().slice(0, 2).join(".");
      return `<article class="calendar-day ${isToday ? "calendar-day-today" : ""}">
        <div class="calendar-day-header"><span class="calendar-day-date">${dateLabel}</span><span class="calendar-day-weekday">${safe(item.weekday)}</span>${isToday ? '<span class="calendar-today-badge">BUGÜN</span>' : ""}</div>
        ${renderTrainingLinks(item.training)}
      </article>`;
    }).join("");
  }
}

function closeEducationCenter() {
  const area = document.getElementById("educationArea");
  if (area) area.style.display = "none";
  showMainMenu();
}
