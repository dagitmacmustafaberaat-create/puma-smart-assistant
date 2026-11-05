(function () {
  // Personel sırası: Mustafa, Sinem, Serkan, Cem, Merve, Ece
  const DAYS = [
    { day: "Pazartesi", date: "02.11.2026", shifts: [
      ["09:30","17:30","08:00","01:00","07:00"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["00:00","00:00","00:00","00:00","00:00"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["09:30","17:30","08:00","01:00","07:00"]
    ]},
    { day: "Salı", date: "03.11.2026", shifts: [
      ["00:00","00:00","00:00","00:00","00:00"],
      ["09:30","22:00","12:30","02:00","10:30"],
      ["09:30","17:30","08:00","01:00","07:00"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["00:00","00:00","00:00","00:00","00:00"]
    ]},
    { day: "Çarşamba", date: "04.11.2026", shifts: [
      ["14:00","22:00","08:00","01:00","07:00"],
      ["09:30","17:00","07:30","01:00","06:30"],
      ["00:00","00:00","00:00","00:00","00:00"],
      ["09:30","22:00","12:30","02:00","10:30"],
      ["12:00","20:00","08:00","01:00","07:00"],
      ["14:00","22:00","08:00","01:00","07:00"]
    ]},
    { day: "Perşembe", date: "05.11.2026", shifts: [
      ["09:30","22:00","12:30","02:00","10:30"],
      ["00:00","00:00","00:00","00:00","00:00"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["12:30","20:00","07:30","01:00","06:30"],
      ["09:30","17:30","08:00","01:00","07:00"],
      ["09:30","22:00","12:30","02:00","10:30"]
    ]},
    { day: "Cuma", date: "06.11.2026", shifts: [
      ["09:30","17:30","08:00","01:00","07:00"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["09:30","22:00","12:30","02:00","10:30"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["00:00","00:00","00:00","00:00","00:00"],
      ["09:30","17:30","08:00","01:00","07:00"]
    ]},
    { day: "Cumartesi", date: "07.11.2026", shifts: [
      ["14:30","22:00","07:30","01:00","06:30"],
      ["09:30","18:00","08:30","01:30","07:00"],
      ["09:30","18:00","08:30","01:30","07:00"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["14:30","22:00","07:30","01:00","06:30"],
      ["12:00","22:00","10:00","01:30","08:30"]
    ]},
    { day: "Pazar", date: "08.11.2026", shifts: [
      ["09:30","18:00","08:30","01:30","07:00"],
      ["14:00","22:00","08:00","01:00","07:00"],
      ["12:30","20:00","07:30","01:00","06:30"],
      ["09:30","18:00","08:30","01:30","07:00"],
      ["09:30","22:00","12:30","02:00","10:30"],
      ["12:30","22:00","09:30","01:30","08:00"]
    ]}
  ];
  const STAFF = [
    { name: "MUSTAFA BERAT DAĞITMAÇ", role: "MAĞAZA MÜDÜRÜ", badge: "COACH", emoji: "🧢", kind: "coach" },
    { name: "SİNEM PALAZ", role: "ŞEF", badge: "ASSISTANT COACH", emoji: "📣", kind: "chief" },
    { name: "SERKAN CANİK", role: "SATIŞ DANIŞMANI", badge: "RUNNER", emoji: "🏃🏻‍♂️", kind: "runner" },
    { name: "CEM AKTAŞ", role: "SATIŞ DANIŞMANI", badge: "RUNNER", emoji: "🏃🏻‍♂️", kind: "runner" },
    { name: "MERVE ÇETİN", role: "SATIŞ DANIŞMANI", badge: "RUNNER", emoji: "🏃🏻‍♀️", kind: "runner" },
    { name: "ECE NUR TEMÜR", role: "SATIŞ DANIŞMANI", badge: "RUNNER", emoji: "🏃🏻‍♀️", kind: "runner" }
  ];
  const esc = v => String(v == null ? "" : v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  let selectedStaff = null;


  function renderTodayOverview() {
    const target = document.getElementById("shiftTodayOverview");
    if (!target) return;
    const now = new Date();
    const todayKey = String(now.getDate()).padStart(2,"0")+"."+String(now.getMonth()+1).padStart(2,"0")+"."+now.getFullYear();
    const today = DAYS.find(day => day.date === todayKey);
    if (!today) {
      target.innerHTML = '<div class="shift-today-empty"><span>BUGÜNÜN PROGRAMI</span><strong>Bugüne ait vardiya kaydı bulunamadı.</strong><small>Güncel haftalık program yüklendiğinde burada otomatik görünecek.</small></div>';
      return;
    }
    const workingCount = today.shifts.filter(s => s && !(s[0]==="00:00"&&s[1]==="00:00")).length;
    const dateLabel = today.day+" • "+today.date;
    const cards = STAFF.map((person,i) => {
      const s = today.shifts[i] || ["00:00","00:00","00:00","00:00","00:00"];
      const off = s[0]==="00:00"&&s[1]==="00:00";
      const role = i===0 ? "MÜDÜR" : i===1 ? "ŞEF" : "PERSONEL";
      const kind = i===0 ? "coach" : i===1 ? "chief" : "runner";
      return '<button type="button" class="shift-today-card shift-today-card-'+kind+(off?' is-off':'')+'" onclick="window.openStaffWeeklySchedule('+i+',event)" aria-label="'+esc(person.name+' haftalık çalışma programını aç')+'">'+
        '<span class="shift-card-topline"><span class="shift-card-role">'+role+'</span><span class="shift-card-arrow" aria-hidden="true">↗</span></span>'+
        '<strong class="shift-card-name">'+esc(person.name)+'</strong>'+
        '<span class="shift-card-job">'+esc(person.role)+'</span>'+
        (off ? '<span class="shift-card-off">İZİNLİ</span>' :
          '<span class="shift-card-hours">'+esc(s[0])+' – '+esc(s[1])+'</span>'+
          '<span class="shift-card-metrics"><span><small>NET</small><b>'+esc(s[4])+'</b></span><span><small>MOLA</small><b>'+esc(s[3])+'</b></span></span>')+
        '<span class="shift-card-open">HAFTALIK PROGRAMI AÇ</span></button>';
    }).join("");
    target.innerHTML = '<div class="shift-today-heading"><div><span>BUGÜNÜN EKİBİ</span><h2>'+esc(dateLabel)+'</h2></div><b>'+workingCount+' / '+STAFF.length+' GÖREVDE</b></div>'+
      '<p class="shift-today-caption">Tüm ekip tek yatay satırda • Bir karta dokunarak haftalık programa geç</p>'+
      '<div class="shift-today-grid" role="list" aria-label="Günlük ekip kartları">'+cards+'</div>';
  }

  function renderRoster() {
    const roster = document.getElementById("shiftStaffRoster");
    if (!roster) return;
    const groups = [
      { title: "COACH • MAĞAZA YÖNETİMİ", ids: [0] },
      { title: "COACH • ŞEF", ids: [1] },
      { title: "RUNNER • SATIŞ EKİBİ", ids: [2,3,4,5] }
    ];
    roster.innerHTML = groups.map(group =>
      '<section class="shift-roster-group"><h2>' + esc(group.title) + '</h2><div class="shift-roster-list">' +
      group.ids.map(i => {
        const p = STAFF[i];
        return '<button type="button" class="shift-person-button shift-person-' + p.kind + '" onclick="openStaffWeeklySchedule(' + i + ')" aria-label="' + esc(p.name + " haftalık çalışma programını aç") + '"><span class="shift-person-emoji" aria-hidden="true">' + p.emoji + '</span><span class="shift-person-copy"><strong>' + esc(p.name) + '</strong><small>' + esc(p.role) + '</small></span><span class="shift-person-tag">' + esc(p.badge) + '</span><span class="shift-person-arrow" aria-hidden="true">›</span></button>';
      }).join("") + '</div></section>'
    ).join("");
  }

  function renderSelectedSchedule() {
    const title = document.getElementById("shiftSelectedName");
    const role = document.getElementById("shiftSelectedRole");
    const schedule = document.getElementById("shiftSelectedSchedule");
    const detail = document.getElementById("shiftSelectedDetail");
    if (selectedStaff === null || !schedule) return;
    const person = STAFF[selectedStaff];
    if (title) title.textContent = person.name;
    if (role) role.textContent = person.role + "  •  " + person.badge;
    schedule.innerHTML = DAYS.map(day => {
      const s = day.shifts[selectedStaff];
      const off = s[0] === "00:00" && s[1] === "00:00";
      return '<article class="shift-person-day' + (off ? ' shift-day-off' : '') + '"><div class="shift-day-label"><strong>' + esc(day.day) + '</strong><small>' + esc(day.date) + '</small></div>' +
        (off ? '<span class="shift-day-off-label">İZİNLİ</span>' : '<div class="shift-time"><span><small>GİRİŞ</small><strong>' + esc(s[0]) + '</strong></span><span><small>ÇIKIŞ</small><strong>' + esc(s[1]) + '</strong></span><span><small>BRÜT</small><strong>' + esc(s[2]) + '</strong></span><span><small>MOLA</small><strong>' + esc(s[3]) + '</strong></span><span><small>NET</small><strong>' + esc(s[4]) + '</strong></span></div>') +
        '</article>';
    }).join("");
    if (detail) detail.textContent = "2–8 Kasım 2026 • Haftalık çalışma programı";
  }

  window.openStaffWeeklySchedule = function (index, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!Number.isInteger(index) || !STAFF[index]) return;
    selectedStaff = index;
    const area = document.getElementById("shiftProgramArea");
    const overview = document.getElementById("shiftTodayOverview");
    const roster = document.getElementById("shiftRosterView");
    const schedule = document.getElementById("shiftSelectedView");
    if (area) area.style.display = "block";
    if (overview) overview.style.display = "none";
    if (roster) roster.style.display = "none";
    if (schedule) schedule.style.display = "block";
    renderSelectedSchedule();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.backToShiftRoster = function () {
    selectedStaff = null;
    const overview = document.getElementById("shiftTodayOverview");
    const roster = document.getElementById("shiftRosterView");
    const schedule = document.getElementById("shiftSelectedView");
    if (schedule) schedule.style.display = "none";
    if (roster) roster.style.display = "none";
    if (overview) overview.style.display = "block";
    renderTodayOverview();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.showShiftProgram = function () {
    ["mainMenu","productSearchArea","sizeSearchArea","educationArea","dailyTasksArea","vmStandardsArea","sdKarneArea"].forEach(id => { const e=document.getElementById(id); if(e)e.style.display="none"; });
    const area=document.getElementById("shiftProgramArea");
    if(area) area.style.display="block";
    selectedStaff = null;
    const roster = document.getElementById("shiftRosterView");
    const schedule = document.getElementById("shiftSelectedView");
    if (roster) roster.style.display = "none";
    if (schedule) schedule.style.display = "none";
    const scheduleContent = document.getElementById("shiftSelectedSchedule");
    const scheduleTitle = document.getElementById("shiftSelectedName");
    const scheduleRole = document.getElementById("shiftSelectedRole");
    if (scheduleContent) scheduleContent.innerHTML = "";
    if (scheduleTitle) scheduleTitle.textContent = "";
    if (scheduleRole) scheduleRole.textContent = "";
    renderTodayOverview();
    window.scrollTo({top:0,behavior:"smooth"});
  };

  window.closeShiftProgram = function () {
    const e=document.getElementById("shiftProgramArea");
    if(e)e.style.display="none";
    if(typeof showMainMenu==="function")showMainMenu();
  };
})();
