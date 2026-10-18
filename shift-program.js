(function () {
  const DAYS = [
    { day: "Pazartesi", date: "19.10.2026", shifts: [["09:30","17:30","01:00"],["14:30","22:00","01:00"],["13:30","22:00","01:00"],["00:00","00:00","00:00"],["09:30","17:30","01:00"],["10:00","22:00","02:00"]] },
    { day: "Salı", date: "20.10.2026", shifts: [["00:00","00:00","00:00"],["09:30","22:00","02:00"],["09:30","17:30","01:00"],["14:30","22:00","01:00"],["12:30","20:00","01:00"],["09:30","22:00","02:00"]] },
    { day: "Çarşamba", date: "21.10.2026", shifts: [["14:30","22:00","01:00"],["09:30","17:30","01:00"],["00:00","00:00","00:00"],["14:00","22:00","01:00"],["12:00","20:00","01:00"],["09:30","22:00","02:00"]] },
    { day: "Perşembe", date: "22.10.2026", shifts: [["09:30","22:00","02:00"],["00:00","00:00","00:00"],["14:00","22:00","01:00"],["14:00","22:00","01:00"],["09:30","17:30","01:00"],["09:30","20:00","01:30"]] },
    { day: "Cuma", date: "23.10.2026", shifts: [["09:30","17:30","01:00"],["14:00","22:00","01:00"],["13:00","22:00","01:30"],["09:30","22:00","02:00"],["00:00","00:00","00:00"],["00:00","00:00","00:00"]] },
    { day: "Cumartesi", date: "24.10.2026", shifts: [["14:00","22:00","01:00"],["09:30","18:00","01:30"],["09:30","22:00","02:00"],["12:00","20:00","01:00"],["14:00","22:00","01:00"],["00:00","00:00","00:00"]] },
    { day: "Pazar", date: "25.10.2026", shifts: [["09:30","18:00","01:30"],["14:00","22:00","01:00"],["13:00","22:00","01:30"],["09:30","17:30","01:00"],["09:30","22:00","02:00"],["00:00","00:00","00:00"]] }
  ];
  const STAFF = ["MUSTAFA BERAT DAĞITMAÇ","SİNEM PALAZ","SERKAN CANİK","CEM AKTAŞ","MERVE ÇETİN","ECE NUR TEMÜR"];
  const esc = v => String(v == null ? "" : v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  function render() {
    const table = document.getElementById("shiftProgramTable");
    const status = document.getElementById("shiftProgramStatus");
    if (!table) return;

    // Tarih her açılışta cihazın yerel saatine göre hesaplanır; günler otomatik sıralanır.
    const now = new Date();
    const todayKey = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    const dateKey = day => { const p = day.date.split("."); return p[2] + "-" + p[1] + "-" + p[0]; };
    const todayIndex = DAYS.findIndex(day => dateKey(day) === todayKey);
    const firstUpcomingIndex = DAYS.findIndex(day => dateKey(day) > todayKey);
    let orderedDays;
    let todayMissing = false;
    if (todayIndex >= 0) {
      orderedDays = DAYS.slice(todayIndex).concat(DAYS.slice(0, todayIndex));
    } else if (firstUpcomingIndex >= 0) {
      // Program haftası başlamadan önce ilk yaklaşan gün gösterilir.
      orderedDays = DAYS.slice(firstUpcomingIndex).concat(DAYS.slice(0, firstUpcomingIndex));
    } else {
      // Bu haftalık programın tarihi geçtiyse eski bir günü bugünün programı gibi göstermeyiz.
      orderedDays = DAYS.slice();
      todayMissing = true;
    }

    const ROLES = ["MAĞAZA MÜDÜRÜ", "ŞEF", "SATIŞ DANIŞMANI", "SATIŞ DANIŞMANI", "SATIŞ DANIŞMANI", "SATIŞ DANIŞMANI"];
    const POSITIONS = ["manager", "chief", "advisor", "advisor", "advisor", "advisor"];
    const ROLES = ["MAĞAZA MÜDÜRÜ", "ŞEF", "SATIŞ DANIŞMANI", "SATIŞ DANIŞMANI", "SATIŞ DANIŞMANI", "SATIŞ DANIŞMANI"];
    const card = (day, isToday) => '<section class="shift-week-day' + (isToday ? ' is-today-shift' : '') + '"><h2>' + esc(day.day) + ' <small>' + esc(day.date) + '</small>' + (isToday ? '<span class="today-shift-badge">BUGÜN</span>' : '') + '</h2><div class="shift-pitch" role="group" aria-label="' + esc(day.day) + ' çalışma programı saha düzeni"><div class="pitch-half-line"></div><div class="pitch-center-circle"><span>BUYAKA<br>PUMA</span></div><div class="pitch-goal pitch-goal-top"></div><div class="pitch-goal pitch-goal-bottom"></div><div class="shift-pitch-row shift-pitch-manager">' + [0].map(i => staffCard(day, i)).join("") + '</div><div class="shift-pitch-row shift-pitch-chief">' + [1].map(i => staffCard(day, i)).join("") + '</div><div class="shift-pitch-row shift-pitch-advisors">' + [2,3,4,5].map(i => staffCard(day, i)).join("") + '</div></div></section>';
    function staffCard(day, i) {
      const s = day.shifts[i];
      const role = ROLES[i];
      const icon = i === 0 ? "👔" : i === 1 ? "🧢" : "⚽";
      return '<article class="shift-staff-card pitch-player"><div class="pitch-player-icon" aria-hidden="true">' + icon + '</div><h3>' + esc(STAFF[i]) + '</h3><p class="pitch-player-role">' + role + '</p><div class="shift-staff-details"><span>🚪 Giriş: ' + esc(s[0]) + '</span><span>🏁 Çıkış: ' + esc(s[1]) + '</span><span>☕ Mola: ' + esc(s[2]) + '</span></div></article>';
    }

    const todayNotice = todayMissing ? '<div class="shift-today-missing">Bu haftalık programın tarih aralığı sona erdi. Yeni haftanın vardiya saatleri eklendiğinde burada otomatik gösterilecektir.</div>' : "";
    table.innerHTML = todayNotice + orderedDays.map((day, i) => card(day, !todayMissing && i === 0)).join("");
    if (status) status.textContent = todayMissing ? "19–25 Ekim 2026 haftalık programı" : (todayIndex >= 0 ? "Bugünün programı en üstte gösteriliyor." : "Haftalık program başlamak üzere; ilk gün en üstte gösteriliyor.");
  }
  window.showShiftProgram = function () {
    ["mainMenu","productSearchArea","sizeSearchArea","educationArea","dailyTasksArea","vmStandardsArea","sdKarneArea"].forEach(id => { const e=document.getElementById(id); if(e)e.style.display="none"; });
    const area=document.getElementById("shiftProgramArea"); if(area)area.style.display="block";
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  };
  window.closeShiftProgram = function () {
    const e=document.getElementById("shiftProgramArea"); if(e)e.style.display="none";
    if(typeof showMainMenu==="function")showMainMenu();
  };
  window.selectShiftProgramDay = function () {};
})();