(function () {
  "use strict";
  function byId(id) { return document.getElementById(id); }
  var workbookCache = null;
  function number(value) {
    if (typeof value === "number") return value;
    var s = String(value == null ? "" : value).trim();
    if (!s) return 0;
    s = s.replace(/\./g, "").replace(",", ".");
    var n = Number(s);
    return isFinite(n) ? n : 0;
  }
  function fmt(value) {
    return Number(value || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  }
  function getWorkbook() {
    if (workbookCache) return Promise.resolve(workbookCache);
    if (!window.XLSX) return Promise.reject(new Error("Excel okuyucu yüklenemedi (XLSX)."));
    var url = "https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/2025-2026%20kar%C5%9F%C4%B1la%C5%9Ft%C4%B1rma.xlsx";
    return fetch(url, { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Excel dosyasına ulaşılamadı (HTTP " + response.status + ").");
      return response.arrayBuffer();
    }).then(function (buffer) {
      workbookCache = window.XLSX.read(buffer, { type: "array" });
      return workbookCache;
    });
  }
  function renderWorkbook(wb) {
    var sheets = wb.SheetNames.map(function (name) {
      return { name: name, rows: window.XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" }) };
    });
    var sheet25 = null, sheet26 = null;
    sheets.forEach(function (sheet) {
      sheet.rows.forEach(function (row) {
        row.forEach(function (cell) {
          var value = String(cell);
          if (!sheet25 && value.indexOf("01.12.2025") !== -1) sheet25 = sheet;
          if (!sheet26 && value.indexOf("01.12.2026") !== -1) sheet26 = sheet;
        });
      });
    });
    sheet25 = sheet25 || sheets[0];
    sheet26 = sheet26 || sheets[1] || sheets[0];
    function dailyRows(sheet, year) {
      var header = -1;
      for (var i = 0; i < sheet.rows.length; i++) {
        if (sheet.rows[i].some(function (v) { return String(v).trim() === "Tarih"; })) { header = i; break; }
      }
      if (header < 0) return [];
      return sheet.rows.slice(header + 1).filter(function (row) {
        return new RegExp("^\\d{2}\\.12\\." + year).test(String(row[0] || "").trim());
      });
    }
    var days25 = dailyRows(sheet25, "2025");
    var days26 = dailyRows(sheet26, "2026");
    var entered = days26.filter(function (row) { return number(row[8]) > 0 || number(row[11]) > 0; });
    var count = entered.length;
    var rows25 = days25.slice(0, count), rows26 = days26.slice(0, count);
    function sum(rows, col) { return rows.reduce(function (total, row) { return total + number(row[col]); }, 0); }
    var metrics = [
      ["CİRO", 7, 8], ["FATURA", 8, 9], ["ÜRÜN ADEDİ", 10, 11], ["TRAFİK", 11, 12]
    ];
    var cards = metrics.map(function (metric) {
      var oldValue = sum(rows25, metric[1]), newValue = sum(rows26, metric[2]);
      var change = oldValue ? (newValue - oldValue) / oldValue * 100 : null;
      return '<article class="st-metric"><small>' + metric[0] + '</small><div class="st-values"><span>2025 <b>' + fmt(oldValue) + '</b></span><span>2026 <b>' + fmt(newValue) + '</b></span></div><strong class="' + (newValue >= oldValue ? "up" : "down") + '">' + (change === null ? "—" : (change > 0 ? "+" : "") + "%" + fmt(change)) + '</strong></article>';
    }).join("");
    var daily = '<div class="st-table-wrap"><table class="st-table"><thead><tr><th>TARİH</th><th>2025 CİRO</th><th>2026 CİRO</th><th>DEĞİŞİM</th></tr></thead><tbody>';
    for (var d = 0; d < count; d++) {
      var oldSales = number(rows25[d] && rows25[d][7]), newSales = number(rows26[d] && rows26[d][8]);
      var delta = oldSales ? ((newSales - oldSales) / oldSales * 100) : null;
      daily += "<tr><td>" + (d + 1) + ".12</td><td>" + fmt(oldSales) + "</td><td>" + fmt(newSales) + '</td><td class="' + (newSales >= oldSales ? "up" : "down") + '">' + (delta === null ? "—" : fmt(delta) + "%") + "</td></tr>";
    }
    daily += "</tbody></table></div>";
    return '<header class="st-hero"><p>BUYAKA PUMA • PERFORMANCE TRACKING</p><h1>MAĞAZA TAKİP</h1><span>ARALIK 2025 / ARALIK 2026 KARŞILAŞTIRMASI</span></header><div class="st-period">2026 veri girilen gün: <b>' + count + ' / 31</b> · 2025 karşılaştırma dönemi: 1–' + count + ' Aralık</div><div class="st-grid">' + cards + '</div><h2 class="st-section-title">GÜNLÜK CİRO KARŞILAŞTIRMASI</h2>' + daily + '<p class="st-note">2026’da veri girilen günler, 2025’in aynı tarihleriyle karşılaştırılır.</p>';
  }
  window.renderStoreTracking = function () {
    var root = byId("storeTrackingDashboard");
    if (!root) { console.error("storeTrackingDashboard alanı bulunamadı."); return; }
    root.innerHTML = '<p class="st-loading">Excel verileri okunuyor…</p>';
    getWorkbook().then(function (wb) {
      root.innerHTML = renderWorkbook(wb);
    }).catch(function (error) {
      console.error("Mağaza Takip başlatma hatası:", error);
      root.innerHTML = '<p class="st-loading">Veri yüklenemedi: ' + String(error.message || error) + '</p>';
    });
  };
  window.showStoreTracking = function () {
    var area = byId("storeTrackingArea"), menu = byId("mainMenu");
    if (!area || !menu) return;
    document.querySelectorAll("body > main, body > section[id]").forEach(function (node) { if (node !== area) node.style.display = "none"; });
    menu.style.display = "none";
    area.style.display = "block";
    window.scrollTo(0, 0);
    window.renderStoreTracking();
  };
  window.closeStoreTracking = function () {
    var area = byId("storeTrackingArea");
    if (area) area.style.display = "none";
    if (typeof window.showMainMenu === "function") window.showMainMenu();
    var menu = byId("mainMenu");
    if (menu) menu.style.display = "flex";
    window.scrollTo(0, 0);
  };
})();