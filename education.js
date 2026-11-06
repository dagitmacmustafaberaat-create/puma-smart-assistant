let educationCalendar = [];

const TRAINING_LIBRARY = [
  { icon: "🧭", title: "VM Kuralları", file: "vmkuralları.docx", group: "VM / SATIŞ" },
  { icon: "🗣️", title: "Satış Teknikleri", file: "satısteknikleri.pptx", group: "VM / SATIŞ" },
  { icon: "👟", title: "Teknoloji Eğitimi", file: "egitim.pdf", group: "TEKNOLOJİ" },
  { icon: "🧮", title: "Perakende Matematiği", file: "perakendematematigi.pdf", group: "UYGULAMA" },
  { icon: "🤝", title: "BACK TO BE NICE", file: "BACK TO BE NICE.pdf", group: "UYGULAMA" }
];

const NOVEMBER_TRAINING_DATES = {
  "2026-11-09": "vm", "2026-11-10": "tech", "2026-11-11": "practice",
  "2026-11-16": "vm", "2026-11-17": "tech", "2026-11-18": "practice",
  "2026-11-23": "vm", "2026-11-24": "tech", "2026-11-25": "practice",
  "2026-11-30": "vm"
};

const DAILY_TRAINING = {
  vm: { label: "VM / SATIŞ", icon: "🧭", topics: ["VM Kuralları", "Satış Teknikleri"] },
  tech: { label: "TEKNOLOJİ", icon: "👟", topics: ["Teknoloji Eğitimi"] },
  practice: { label: "UYGULAMA", icon: "🧮", topics: ["Perakende Matematiği", "BACK TO BE NICE"] }
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
      training: kind ? DAILY_TRAINING[kind] : null
    });
  }
  renderEducationCalendar();
  renderTrainingLibrary();
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

function renderTrainingLibrary() {
  const target = document.getElementById("trainingLibrary");
  if (!target) return;
  target.innerHTML = TRAINING_LIBRARY.map(function (item) {
    return `<button type="button" class="training-resource" onclick="openTrainingResource('${item.file.replace(/'/g, "\\'")}')">
      <span class="training-resource-sticker" aria-hidden="true">${item.icon}</span>
      <span class="training-resource-copy"><small>${item.group}</small><strong>${item.title}</strong></span>
      <span class="training-resource-arrow" aria-hidden="true">↗</span>
    </button>`;
  }).join("");
}

function renderDayTopics(training) {
  if (!training) return '<div class="calendar-no-training">— <span>Planlı eğitim yok</span></div>';
  return '<div class="calendar-day-topics">' + training.topics.map(function (topic) {
    return '<div class="calendar-day-topic"><span aria-hidden="true">' + training.icon +
      '</span><strong>' + topic + '</strong></div>';
  }).join("") + '</div>';
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
      <div class="today-topline"><span class="today-dot"></span>${current.date === today ? "BUGÜNÜN EĞİTİMİ" : "SIRADAKİ EĞİTİM"}</div>
      <div class="today-date">${safe(current.weekday)} • ${current.date.split("-").reverse().join(".")}</div>
      <div class="today-daily-topics">${renderDayTopics(current.training)}</div>` :
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
        ${renderDayTopics(item.training)}
      </article>`;
    }).join("");
  }
}

function closeEducationCenter() {
  const area = document.getElementById("educationArea");
  if (area) area.style.display = "none";
  showMainMenu();
}
