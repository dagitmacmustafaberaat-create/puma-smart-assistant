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
    const working = today.shifts.map((s,i)=>({s,i})).filter(({s})=>!(s[0]==="00:00"&&s[1]==="00:00"));
    const dateLabel = today.day+" • "+today.date;
    const groups = [
      { title:"MÜDÜR", subtitle:"STORE MANAGER", kind:"coach", ids:[0] },
      { title:"ŞEF", subtitle:"SUPERVISOR", kind:"chief", ids:[1] },
      { title:"PERSONEL", subtitle:"SALES TEAM", kind:"runner", ids:[2,3,4,5] }
    ];
    const columns = groups.map(group => {
      const people = group.ids.map(i => ({s:today.shifts[i],i})).filter(({s})=>s && !(s[0]==="00:00"&&s[1]==="00:00"));
      return '<section class="shift-today-role-column shift-today-role-'+group.kind+'"><header class="shift-today-role-heading"><span>'+group.title+'</span><small>'+group.subtitle+'</small></header>'+
        (people.length ? '<div class="shift-today-role-list">'+people.map(({s,i})=>{
          const p=STAFF[i];
          return '<article class="shift-today-card"><button type="button" class="shift-today-person-link" onclick="window.openStaffWeeklySchedule('+i+',event)" aria-label="'+esc(p.name+' haftalık çalışma programını aç')+'">'+esc(p.name)+' <span aria-hidden="true">↗</span></button><div class="shift-today-time"><span><small>VARDİYA</small><strong>'+esc(s[0])+' – '+esc(s[1])+'</strong></span><span><small>ÇALIŞMA</small><strong>'+esc(s[2])+'</strong></span><span><small>MOLA</small><strong>'+esc(s[3])+'</strong></span><span><small>NET</small><strong>'+esc(s[4])+'</strong></span></div></article>';
        }).join("")+'</div>' : '<div class="shift-today-role-empty">Bugün vardiyası yok</div>')+'</section>';
    }).join("");
    target.innerHTML = '<div class="shift-today-heading"><div><span>BUGÜNÜN PROGRAMI</span><h2>'+esc(dateLabel)+'</h2></div><b>'+working.length+' PERSONEL</b></div>'+
      (working.length ? '<div class="shift-today-grid">'+columns+'</div>' : '<div class="shift-today-empty">Bugün ekipte vardiyası olan personel bulunmuyor.</div>');
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
    const roster = document.getElementById("shiftRosterView");
    const schedule = document.getElementById("shiftSelectedView");
    if (area) area.style.display = "block";
    if (roster) roster.style.display = "none";
    if (schedule) schedule.style.display = "block";
    renderSelectedSchedule();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.backToShiftRoster = function () {
    selectedStaff = null;
    const roster = document.getElementById("shiftRosterView");
    const schedule = document.getElementById("shiftSelectedView");
    if (schedule) schedule.style.display = "none";
    if (roster) roster.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.showShiftProgram = function () {
    ["mainMenu","productSearchArea","sizeSearchArea","educationArea","dailyTasksArea","vmStandardsArea","sdKarneArea"].forEach(id => { const e=document.getElementById(id); if(e)e.style.display="none"; });
    const area=document.getElementById("shiftProgramArea");
    if(area) area.style.display="block";
    selectedStaff = null;
    const roster = document.getElementById("shiftRosterView");
    const schedule = document.getElementById("shiftSelectedView");
    if (roster) roster.style.display = "block";
    if (schedule) schedule.style.display = "none";
    const scheduleContent = document.getElementById("shiftSelectedSchedule");
    const scheduleTitle = document.getElementById("shiftSelectedName");
    const scheduleRole = document.getElementById("shiftSelectedRole");
    if (scheduleContent) scheduleContent.innerHTML = "";
    if (scheduleTitle) scheduleTitle.textContent = "";
    if (scheduleRole) scheduleRole.textContent = "";
    renderTodayOverview();
    renderRoster();
    window.scrollTo({top:0,behavior:"smooth"});
  };

  window.closeShiftProgram = function () {
    const e=document.getElementById("shiftProgramArea");
    if(e)e.style.display="none";
    if(typeof showMainMenu==="function")showMainMenu();
  };
})();
