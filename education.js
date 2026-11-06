let educationCalendar = [];

function showEducationCenter() {
  ["productSearchArea", "sizeSearchArea", "dailyTasksArea", "vmStandardsArea"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const area = document.getElementById("educationArea");
  const menu = document.getElementById("mainMenu");
  if (menu) menu.style.display = "none";
  if (area) area.style.display = "block";
  if (educationCalendar.length) renderEducationCalendar();
  else loadEducationCalendar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function normalizeEducationHeader(value) {
  return String(value || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLocaleUpperCase("tr-TR").replace(/İ/g, "I").replace(/[^A-Z0-9]+/g, " ").trim();
}

function parseEducationDate(value) {
  if (value instanceof Date && !isNaN(value)) return value;
  if (typeof value === "number" && window.XLSX && XLSX.SSF) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const text = String(value || "").trim();
  if (!text) return null;
  let match = text.match(/^(\\d{1,2})[.\\/-](\\d{1,2})[.\\/-](\\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const date = new Date(text);
  return isNaN(date) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function educationRowsFromWorkbook(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  let headerIndex = -1, dateCol = -1, weekdayCol = -1, vmCol = -1, techCol = -1, practiceCol = -1;
  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const headers = (rows[r] || []).map(normalizeEducationHeader);
    const date = headers.findIndex(x => /(^| )(TARIH|DATE|GUN)( |$)/.test(x) || x === "TARIH");
    const vm = headers.findIndex(x => /VM|SATIS|VISUAL MERCHANDISING/.test(x));
    const tech = headers.findIndex(x => /TEKNOLOJI|TEKSTIL|AYAKKABI|FOOTWEAR|TEXTILE/.test(x));
    const practice = headers.findIndex(x => /UYGULAMA|PRACTICE|AKTIVITE/.test(x));
    if (date >= 0 && (vm >= 0 || tech >= 0 || practice >= 0)) {
      headerIndex = r; dateCol = date;
      weekdayCol = headers.findIndex(x => /HAFTA GUNU|GUN ADI|WEEKDAY/.test(x));
      vmCol = vm; techCol = tech; practiceCol = practice;
      break;
    }
  }
  if (headerIndex < 0) throw new Error("Kasım eğitim Excel'inde Tarih ve konu başlıkları bulunamadı.");
  const data = [];
  rows.slice(headerIndex + 1).forEach(row => {
    const date = parseEducationDate(row[dateCol]);
    if (!date) return;
    const fmt = n => String(n).padStart(2, "0");
    const weekday = weekdayCol >= 0 && row[weekdayCol]
      ? String(row[weekdayCol]).trim()
      : date.toLocaleDateString("tr-TR", { weekday: "long" });
    const topic = index => index >= 0 ? String(row[index] || "").trim() : "";
    data.push({
      date: date.getFullYear() + "-" + fmt(date.getMonth() + 1) + "-" + fmt(date.getDate()),
      weekday: weekday.charAt(0).toLocaleUpperCase("tr-TR") + weekday.slice(1),
      vm: topic(vmCol) || "Günlük eğitim konusu",
      tech: topic(techCol) || "Teknoloji eğitimi",
      practice: topic(practiceCol) || "Uygulama"
    });
  });
  if (!data.length) throw new Error("Kasım eğitim Excel'inde tarihli eğitim kaydı bulunamadı.");
  return data.sort((a, b) => a.date.localeCompare(b.date));
}

async function loadEducationCalendar() {
  const target = document.getElementById("educationCalendar");
  try {
    if (!window.XLSX) throw new Error("Excel okuma bileşeni yüklenemedi.");
    const response = await fetch("./Kasim_2026_Egitim_Takvimi.xlsx?v=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("Kasım 2026 Eğitim Takvimi Excel dosyası açılamadı.");
    const workbook = XLSX.read(await response.arrayBuffer(), { type: "array", cellDates: true });
    educationCalendar = educationRowsFromWorkbook(workbook);
    renderEducationCalendar();
  } catch (error) {
    if (target) target.innerHTML = '<div class="notfound">Kasım 2026 eğitim takvimi yüklenemedi: ' + String(error.message || error).replace(/[&<>"]/g, "") + '</div>';
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
        <button class="topic-card topic-vm" type="button" onclick="openVMRules('${encodeURIComponent(current.vm)}')"><span class="topic-label">VM & SATIŞ TEKNİKLERİ</span><strong>${safe(current.vm)}</strong><span class="topic-open">Dokümanı aç ↗</span></button>
        <button class="topic-card topic-tech" type="button" onclick="openTechnologyDocument('${encodeURIComponent(current.tech)}')"><span class="topic-label">TEKSTİL & AYAKKABI TEKNOLOJİLERİ</span><strong>${safe(current.tech)}</strong><span class="topic-open">Dokümanı aç ↗</span></button>
        <button class="topic-card topic-practice" type="button" onclick="return false"><span class="topic-label">UYGULAMA</span><strong>${safe(current.practice)}</strong><span class="topic-open">Dokümanı aç ↗</span></button>
      </div>` : '<div class="today-topline">GÜNÜN EĞİTİMİ</div><p class="outside-calendar">Bugün için takvimde kayıt bulunamadı. Aylık planı inceleyebilirsiniz.</p>';
  }

  const rangeLabel = document.getElementById("educationCalendarRange");
  if (rangeLabel && educationCalendar.length) {
    const first = new Date(educationCalendar[0].date + "T00:00:00");
    const last = new Date(educationCalendar[educationCalendar.length - 1].date + "T00:00:00");
    const month = first.toLocaleDateString("tr-TR", { month: "long" });
    rangeLabel.textContent = month.charAt(0).toLocaleUpperCase("tr-TR") + month.slice(1) + " " + first.getFullYear();
  }

  if (calendarBox) {
    calendarBox.innerHTML = educationCalendar.map(function (item) {
      const isToday = item.date === today;
      const dateLabel = item.date.split("-").reverse().slice(0, 2).join(".");
      return `<article class="calendar-day ${isToday ? "calendar-day-today" : ""}">
        <div class="calendar-day-header"><span class="calendar-day-date">${dateLabel}</span><span class="calendar-day-weekday">${safe(item.weekday)}</span>${isToday ? '<span class="calendar-today-badge">BUGÜN</span>' : ""}</div>
        <button type="button" class="calendar-topic" onclick="openVMRules('${encodeURIComponent(item.vm)}')"><span>VM / SATIŞ</span><strong>${safe(item.vm)}</strong></button>
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

function openVMRules(topic) {
  let decodedTopic = String(topic || "");
  try { decodedTopic = decodeURIComponent(decodedTopic); } catch (error) { console.warn("Eğitim konusu çözümlenemedi.", error); }
  if (decodedTopic.toLocaleLowerCase("tr-TR").includes("satış teknikleri")) {
    window.open("./sat%C4%B1steknikleri.pptx", "_blank", "noopener");
    return;
  }
  window.open("./vmkurallar%C4%B1.docx", "_blank", "noopener");
}

function closeEducationCenter() {
  const area = document.getElementById("educationArea");
  if (area) area.style.display = "none";
  showMainMenu();
}
