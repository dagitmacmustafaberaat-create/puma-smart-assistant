let educationCalendar = [];

function showEducationCenter() {
  ["mainMenu", "productSearchArea", "sizeSearchArea"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const area = document.getElementById("educationArea");
  if (area) area.style.display = "block";
  if (educationCalendar.length) renderEducationCalendar();
  else loadEducationCalendar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadEducationCalendar() {
  const target = document.getElementById("educationCalendar");
  try {
    const response = await fetch("./education-calendar.json?v=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("Takvim dosyası yüklenemedi.");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Takvim biçimi geçersiz.");
    educationCalendar = data;
    renderEducationCalendar();
  } catch (error) {
    if (target) target.innerHTML = '<div class="notfound">Eğitim takvimi yüklenemedi. Lütfen daha sonra tekrar deneyin.</div>';
    console.error(error);
  }
}

function renderEducationCalendar() {
  const now = new Date();
  const today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const current = educationCalendar.find(function (item) { return item.date === today; });
  const todayBox = document.getElementById("todayTraining");
  const calendarBox = document.getElementById("educationCalendar");
  const safe = function (value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  if (todayBox) {
    todayBox.innerHTML = current ? `
      <div class="today-topline"><span class="today-dot"></span> BUGÜNÜN EĞİTİMİ</div>
      <div class="today-date">${safe(current.weekday)} • ${current.date.split("-").reverse().join(".")}</div>
      <div class="today-topic-grid">
        <button class="topic-card topic-vm" type="button" onclick="openVMRules()"><span class="topic-label">VM & SATIŞ TEKNİKLERİ</span><strong>${safe(current.vm)}</strong><span class="topic-open">Dokümanı aç ↗</span></button>
        <button class="topic-card topic-tech" type="button" onclick="openTechnologyDocument('${encodeURIComponent(current.tech)}')"><span class="topic-label">TEKSTİL & AYAKKABI TEKNOLOJİLERİ</span><strong>${safe(current.tech)}</strong><span class="topic-open">Dokümanı aç ↗</span></button>
        <button class="topic-card topic-practice" type="button" onclick="return false"><span class="topic-label">UYGULAMA</span><strong>${safe(current.practice)}</strong><span class="topic-open">Dokümanı aç ↗</span></button>
      </div>` : '<div class="today-topline">GÜNÜN EĞİTİMİ</div><p class="outside-calendar">Bugün için takvimde kayıt bulunamadı. Aylık planı inceleyebilirsiniz.</p>';
  }

  if (calendarBox) {
    calendarBox.innerHTML = educationCalendar.map(function (item) {
      const isToday = item.date === today;
      const dateLabel = item.date.split("-").reverse().slice(0, 2).join(".");
      return `<article class="calendar-day ${isToday ? "calendar-day-today" : ""}">
        <div class="calendar-day-header"><span class="calendar-day-date">${dateLabel}</span><span class="calendar-day-weekday">${safe(item.weekday)}</span>${isToday ? '<span class="calendar-today-badge">BUGÜN</span>' : ""}</div>
        <button type="button" class="calendar-topic" onclick="openVMRules()"><span>VM / SATIŞ</span><strong>${safe(item.vm)}</strong></button>
        <button type="button" class="calendar-topic" onclick="openTechnologyDocument('${encodeURIComponent(item.tech)}')"><span>TEKNOLOJİ</span><strong>${safe(item.tech)}</strong></button>
        <button type="button" class="calendar-topic calendar-practice" onclick="return false"><span>UYGULAMA</span><strong>${safe(item.practice)}</strong></button>
      </article>`;
    }).join("");
  }
}

function openTechnologyDocument(topic) {
  // Tüm teknoloji eğitim bağlantıları PDF'nin 3. sayfasındaki teknoloji içindekiler bölümünü açar.
  window.open("./egitim.pdf#page=3", "_blank", "noopener");
}

function openVMRules() {
  window.open("./vmkurallar%C4%B1.docx", "_blank", "noopener");
}

function closeEducationCenter() {
  const area = document.getElementById("educationArea");
  if (area) area.style.display = "none";
  showMainMenu();
}
