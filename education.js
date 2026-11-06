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
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase("tr-TR")
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function parseEducationDate(value) {
  if (value instanceof Date && !isNaN(value)) return value;
  if (typeof value === "number" && window.XLSX && XLSX.SSF) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const text = String(value || "").trim();
  if (!text) return null;
  let match = text.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const date = new Date(text);
  return isNaN(date) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function educationRowsFromWorkbook(workbook) {
  const categoryFromHeader = value => {
    const h = normalizeEducationHeader(value);
    if (/VM|SATIS|VISUAL|MERCHANDISING/.test(h)) return "vm";
    if (/TEKNOLOJI|TEKSTIL|AYAKKABI|FOOTWEAR|TEXTILE/.test(h)) return "tech";
    if (/UYGULAMA|PRACTICE|AKTIVITE/.test(h)) return "practice";
    return "";
  };
  const isWeekOrWeekday = value => {
    const text = normalizeEducationHeader(value);
    return !text || /HAFTA|PAZARTESI|SALI|CARSAMBA|PERSEMBE|CUMA|CUMARTESI|PAZAR|VM|SATIS|TEKNOLOJI|UYGULAMA/.test(text);
  };
  const dateOnly = value => {
    const d = parseEducationDate(value);
    return d && d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() >= 1 && d.getDate() <= 30 ? d : null;
  };
  const merged = new Map();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
    if (!rows.length) continue;

    let headerIndex = 0;
    let headers = [];
    let categoryCols = { vm: -1, tech: -1, practice: -1 };
    let bestHeaderScore = -1;

    // Başlık satırını yalnızca ilk hücrede "TARİH" arayarak seçme:
    // eğitim türleri ve tarih sütunları farklı bloklarda bulunabiliyor.
    for (let r = 0; r < Math.min(rows.length, 40); r++) {
      const candidate = (rows[r] || []).map(normalizeEducationHeader);
      const found = { vm: -1, tech: -1, practice: -1 };
      candidate.forEach((h, c) => {
        const kind = categoryFromHeader(h);
        if (kind && found[kind] < 0) found[kind] = c;
      });
      const score = Object.values(found).filter(c => c >= 0).length +
        (candidate.some(h => /TARIH|DATE|GUN/.test(h)) ? 1 : 0);
      if (score > bestHeaderScore) {
        bestHeaderScore = score;
        headerIndex = r;
        headers = candidate;
        categoryCols = found;
      }
    }

    const sheetEntries = [];
    for (let r = headerIndex + 1; r < rows.length; r++) {
      const row = rows[r] || [];
      const dates = [];
      row.forEach((value, c) => {
        const d = dateOnly(value);
        if (d) dates.push({ date: d, col: c });
      });
      if (!dates.length) continue;

      const topicAt = kind => {
        const col = categoryCols[kind];
        if (col < 0) return "";
        const value = row[col];
        if (value instanceof Date || dateOnly(value)) return "";
        const text = String(value || "").trim();
        return isWeekOrWeekday(text) ? "" : text;
      };
      const topics = {
        vm: topicAt("vm"),
        tech: topicAt("tech"),
        practice: topicAt("practice")
      };

      dates.sort((a, b) => a.col - b.col);
      dates.forEach((item, index) => {
        const d = item.date;
        const weekdayIndex = d.getDay();
        const kind = weekdayIndex === 1 ? "vm" : weekdayIndex === 2 ? "tech" : weekdayIndex === 3 ? "practice" : (["vm", "tech", "practice"][index] || "vm");
        let topic = topics[kind];

        // Konu hücresi başlığın altında değilse, ilgili tarih hücresinin
        // yakınındaki açıklama hücrelerinden al; hafta/haftanın günü etiketlerini atla.
        if (!topic) {
          const candidates = [item.col - 1, item.col + 1, item.col - 2, item.col + 2];
          for (const c of candidates) {
            if (c < 0 || c >= row.length) continue;
            const value = row[c];
            if (!value || value instanceof Date || dateOnly(value)) continue;
            const candidate = String(value).trim();
            if (!isWeekOrWeekday(candidate) && candidate.length > 1) {
              topic = candidate;
              break;
            }
          }
        }

        const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        const weekday = d.toLocaleDateString("tr-TR", { weekday: "long" });
        const entry = merged.get(key) || {
          date: key,
          weekday: weekday.charAt(0).toLocaleUpperCase("tr-TR") + weekday.slice(1),
          vm: "—", tech: "—", practice: "—"
        };
        if (topic) entry[kind] = topic;
        merged.set(key, entry);
      });

      // Tek tarih hücreli klasik şablonlarda aynı satırdaki üç konu alanını koru.
      if (dates.length === 1) {
        const d = dates[0].date;
        const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        const entry = merged.get(key);
        ["vm", "tech", "practice"].forEach(kind => {
          if (topics[kind]) entry[kind] = topics[kind];
        });
      }
    }

    sheetEntries.push(...merged.values());
  }

  if (!sheetEntries.length) {
    throw new Error("Kasım 2026 sayfalarında 1–30 Kasım arasına ait tarih hücresi bulunamadı.");
  }
  const unique = new Map();
  sheetEntries.forEach(item => {
    const existing = unique.get(item.date);
    if (!existing) unique.set(item.date, item);
    else ["vm", "tech", "practice"].forEach(kind => {
      if ((existing[kind] === "—" || !existing[kind]) && item[kind] && item[kind] !== "—") existing[kind] = item[kind];
    });
  });
  return Array.from(unique.values()).sort((a, b) => a.date.localeCompare(b.date));
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
  const current = educationCalendar.find(function (item) { return item.date === today; }) ||
    educationCalendar.find(function (item) { return item.date > today; });
  const todayBox = document.getElementById("todayTraining");
  const calendarBox = document.getElementById("educationCalendar");
  const safe = function (value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  if (todayBox) {
    todayBox.innerHTML = current ? `
      <div class="today-topline"><span class="today-dot"></span> ${current.date === today ? "BUGÜNÜN EĞİTİMİ" : "SIRADAKİ EĞİTİM"}</div>
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
