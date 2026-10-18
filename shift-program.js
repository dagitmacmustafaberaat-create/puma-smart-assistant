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
    table.innerHTML = DAYS.map(day => '<section class="shift-week-day"><h2>' + esc(day.day) + ' <small>' + esc(day.date) + '</small></h2><div class="shift-staff-list">' + STAFF.map((name,i) => {
      const s = day.shifts[i];
      return '<article class="shift-staff-card"><h3>' + esc(name) + '</h3><div class="shift-staff-details"><span>Giriş ' + esc(s[0]) + '</span><span>Çıkış ' + esc(s[1]) + '</span><span>Mola ' + esc(s[2]) + '</span></div></article>';
    }).join("") + '</div></section>').join("");
    if (status) status.textContent = "";
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