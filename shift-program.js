(function () {
  // Personel sırası: Mustafa, Sinem, Serkan, Cem, Merve, Ece
  const WEEKS = [
    { label: "W46", range: "9–15 Kasım 2026", days: [
      { day: "Pazartesi", date: "09.11.2026", shifts: [["09:30","17:30","08:00","01:00","07:00"],["14:30","22:00","07:30","01:00","06:30"],["14:00","22:00","08:00","01:00","07:00"],["00:00","00:00","00:00","00:00","00:00"],["09:30","22:00","12:30","02:00","10:30"],["09:30","17:30","08:00","01:00","07:00"]] },
      { day: "Salı", date: "10.11.2026", shifts: [["00:00","00:00","00:00","00:00","00:00"],["09:30","22:00","12:30","02:00","10:30"],["12:00","20:00","08:00","01:00","07:00"],["14:00","22:00","08:00","01:00","07:00"],["09:30","22:00","12:30","02:00","10:30"],["00:00","00:00","00:00","00:00","00:00"]] },
      { day: "Çarşamba", date: "11.11.2026", shifts: [["14:00","22:00","08:00","01:00","07:00"],["09:00","17:00","08:00","01:00","07:00"],["09:30","22:00","12:30","02:00","10:30"],["12:00","20:00","08:00","01:00","07:00"],["09:30","22:00","12:30","02:00","10:30"],["14:30","22:00","07:30","01:00","06:30"]] },
      { day: "Perşembe", date: "12.11.2026", shifts: [["09:30","22:00","12:30","02:00","10:30"],["00:00","00:00","00:00","00:00","00:00"],["09:30","17:30","08:00","01:00","07:00"],["14:00","22:00","08:00","01:00","07:00"],["09:30","18:00","08:30","01:30","07:00"],["14:00","22:00","08:00","01:00","07:00"]] },
      { day: "Cuma", date: "13.11.2026", shifts: [["09:30","17:30","08:00","01:00","07:00"],["14:00","22:00","08:00","01:00","07:00"],["00:00","00:00","00:00","00:00","00:00"],["14:00","22:00","08:00","01:00","07:00"],["00:00","00:00","00:00","00:00","00:00"],["09:30","22:00","12:30","02:00","10:30"]] },
      { day: "Cumartesi", date: "14.11.2026", shifts: [["14:30","22:00","07:30","01:00","06:30"],["09:30","18:00","08:30","01:30","07:00"],["14:00","22:00","08:00","01:00","07:00"],["09:30","22:00","12:30","02:00","10:30"],["00:00","00:00","00:00","00:00","00:00"],["12:00","20:00","08:00","01:00","07:00"]] },
      { day: "Pazar", date: "15.11.2026", shifts: [["09:30","18:00","08:30","01:30","07:00"],["14:00","22:00","08:00","01:00","07:00"],["14:30","22:00","07:30","01:00","06:30"],["09:30","17:30","08:00","01:00","07:00"],["00:00","00:00","00:00","00:00","00:00"],["14:00","22:00","08:00","01:00","07:00"]] }
    ]},
    { label: "W45", range: "2–8 Kasım 2026", days: [
      { day: "Pazartesi", date: "02.11.2026", shifts: [["09:30","17:30","08:00","01:00","07:00"],["14:00","22:00","08:00","01:00","07:00"],["14:00","22:00","08:00","01:00","07:00"],["00:00","00:00","00:00","00:00","00:00"],["14:00","22:00","08:00","01:00","07:00"],["09:30","17:30","08:00","01:00","07:00"]] },
      { day: "Salı", date: "03.11.2026", shifts: [["00:00","00:00","00:00","00:00","00:00"],["09:30","22:00","12:30","02:00","10:30"],["09:30","17:30","08:00","01:00","07:00"],["14:00","22:00","08:00","01:00","07:00"],["14:00","22:00","08:00","01:00","07:00"],["00:00","00:00","00:00","00:00","00:00"]] },
      { day: "Çarşamba", date: "04.11.2026", shifts: [["14:00","22:00","08:00","01:00","07:00"],["09:30","17:00","07:30","01:00","06:30"],["00:00","00:00","00:00","00:00","00:00"],["09:30","22:00","12:30","02:00","10:30"],["12:00","20:00","08:00","01:00","07:00"],["14:00","22:00","08:00","01:00","07:00"]] },
      { day: "Perşembe", date: "05.11.2026", shifts: [["09:30","22:00","12:30","02:00","10:30"],["00:00","00:00","00:00","00:00","00:00"],["14:00","22:00","08:00","01:00","07:00"],["12:30","20:00","07:30","01:00","06:30"],["09:30","17:30","08:00","01:00","07:00"],["09:30","22:00","12:30","02:00","10:30"]] },
      { day: "Cuma", date: "06.11.2026", shifts: [["09:30","17:30","08:00","01:00","07:00"],["14:00","22:00","08:00","01:00","07:00"],["09:30","22:00","12:30","02:00","10:30"],["14:00","22:00","08:00","01:00","07:00"],["00:00","00:00","00:00","00:00","00:00"],["09:30","17:30","08:00","01:00","07:00"]] },
      { day: "Cumartesi", date: "07.11.2026", shifts: [["14:30","22:00","07:30","01:00","06:30"],["09:30","18:00","08:30","01:30","07:00"],["09:30","18:00","08:30","01:30","07:00"],["14:00","22:00","08:00","01:00","07:00"],["14:30","22:00","07:30","01:00","06:30"],["12:00","22:00","10:00","01:30","08:30"]] },
      { day: "Pazar", date: "08.11.2026", shifts: [["09:30","18:00","08:30","01:30","07:00"],["14:00","22:00","08:00","01:00","07:00"],["12:30","20:00","07:30","01:00","06:30"],["09:30","18:00","08:30","01:30","07:00"],["09:30","22:00","12:30","02:00","10:30"],["12:30","22:00","09:30","01:30","08:00"]] }
    ]}
  ];
  const DAYS = WEEKS[0].days;
  const STAFF = [
    { name: "MUSTAFA BERAT DAĞITMAÇ", role: "MAĞAZA MÜDÜRÜ", badge: "COACH", emoji: "🧢", kind: "coach" },
    { name: "SİNEM PALAZ", role: "ŞEF", badge: "ASSISTANT COACH", emoji: "📣", kind: "chief" },
    { name: "SERKAN CANİK", role: "SATIŞ DANIŞMANI", badge: "RUNNER", emoji: "🏃🏻‍♂️", kind: "runner" },
    { name: "CEM AKTAŞ", role: "SATIŞ DANIŞMANI", badge: "RUNNER", emoji: "🏃🏻‍♂️", kind: "runner" },
    { name: "MERVE ÇETİN", role: "SATIŞ DANIŞMANI", badge: "RUNNER", emoji: "🏃🏻‍♀️", kind: "runner" },
    { name: "ECE NUR TEMÜR", role: "SATIŞ DANIŞMANI", badge: "RUNNER", emoji: "🏃🏻‍♀️", kind: "runner" }
  ];
  window.BUYAKA_SHIFT_DATA = { staff: STAFF, weeks: WEEKS };
  const esc = v => String(v == null ? "" : v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  let selectedStaff = null;
  let selectedWeek = 0;


  function renderTodayOverview() {
    const target = document.getElementById("shiftTodayOverview");
    if (!target) return;
    const now = new Date();
    const todayKey = String(now.getDate()).padStart(2,"0")+"."+String(now.getMonth()+1).padStart(2,"0")+"."+now.getFullYear();
    const today = WEEKS.flatMap(week => week.days).find(day => day.date === todayKey);
    let todayHtml = '<div class="shift-today-empty"><span>BUGÜNÜN PROGRAMI</span><strong>Bugüne ait vardiya kaydı bulunamadı.</strong><small>Güncel haftalık program aşağıdaki hafta butonlarından açılabilir.</small></div>';
    if (today) {
      const workingCount = today.shifts.filter(s => s && !(s[0]==="00:00"&&s[1]==="00:00")).length;
      const cards = STAFF.map((person,i) => {
        const s = today.shifts[i] || ["00:00","00:00","00:00","00:00","00:00"];
        const off = s[0]==="00:00"&&s[1]==="00:00";
        const role = i===0 ? "MÜDÜR" : i===1 ? "ŞEF" : "PERSONEL";
        const kind = i===0 ? "coach" : i===1 ? "chief" : "runner";
        return '<article class="shift-today-card shift-today-card-'+kind+(off?' is-off':'')+'">'+
          '<span class="shift-card-topline"><span class="shift-card-role">'+role+'</span></span>'+
          '<strong class="shift-card-name">'+esc(person.name)+'</strong>'+
          '<span class="shift-card-job">'+esc(person.role)+'</span>'+
          (off ? '<span class="shift-card-off">İZİNLİ</span>' :
            '<span class="shift-card-hours">'+esc(s[0])+' – '+esc(s[1])+'</span>'+
            '<span class="shift-card-metrics"><span><small>NET</small><b>'+esc(s[4])+'</b></span><span><small>MOLA</small><b>'+esc(s[3])+'</b></span></span>')+
          '</article>';
      }).join("");
      todayHtml = '<div class="shift-today-heading"><div><span>BUGÜNÜN EKİBİ</span><h2>'+esc(today.day+" • "+today.date)+'</h2></div><b>'+workingCount+' / '+STAFF.length+' GÖREVDE</b></div>'+
        '<div class="shift-today-grid" role="list" aria-label="Günlük ekip kartları">'+cards+'</div>';
    }
    const weekButtons = WEEKS.map((week,i) =>
      '<button type="button" class="shift-week-launch" onclick="window.openShiftWeek('+i+')">'+
      '<span class="shift-week-launch-label">'+esc(week.label)+'</span>'+
      '<span class="shift-week-launch-range">'+esc(week.range)+'</span>'+
      '<strong>HAFTALIK PROGRAMI AÇ <span aria-hidden="true">↗</span></strong></button>'
    ).join("");
    target.innerHTML = todayHtml+
      '<section class="shift-week-picker"><div class="shift-week-picker-heading"><span>VARDİYA ARŞİVİ</span><h2>HAFTALIK ÇALIŞMA PROGRAMLARI</h2><small>İstediğin haftayı seç; program doğrudan o haftanın tamamını açar.</small></div><div class="shift-week-launch-grid">'+weekButtons+'</div></section>';
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
    if (!schedule) return;
    const week = WEEKS[selectedWeek] || WEEKS[0];
    if (title) title.textContent = week.label + " • " + week.range;
    if (role) role.textContent = "BUYAKA PUMA • TÜM EKİP VARDİYA PLANI";
    if (detail) detail.textContent = "Seçilen haftanın tüm personel vardiyaları";
    schedule.innerHTML = week.days.map(day => {
      const staffRows = STAFF.map((person,i) => {
        const s = day.shifts[i] || ["00:00","00:00","00:00","00:00","00:00"];
        const off = s[0] === "00:00" && s[1] === "00:00";
        return '<div class="shift-week-staff-row"><strong>'+esc(person.name)+'</strong><span>'+esc(person.role)+'</span>'+
          (off ? '<b class="shift-day-off-label">İZİNLİ</b>' : '<div class="shift-week-staff-hours"><b>'+esc(s[0])+' – '+esc(s[1])+'</b><small>BRÜT '+esc(s[2])+' • MOLA '+esc(s[3])+' • NET '+esc(s[4])+'</small></div>')+
          '</div>';
      }).join("");
      return '<section class="shift-week-day-block"><div class="shift-week-day-title"><strong>'+esc(day.day)+'</strong><span>'+esc(day.date)+'</span></div>'+staffRows+'</section>';
    }).join("");
  }

  window.openShiftWeek = function(index) {
    if (!Number.isInteger(index) || !WEEKS[index]) return;
    selectedWeek = index;
    selectedStaff = null;
    const overview = document.getElementById("shiftTodayOverview");
    const roster = document.getElementById("shiftRosterView");
    const schedule = document.getElementById("shiftSelectedView");
    if (overview) overview.style.display = "none";
    if (roster) roster.style.display = "none";
    if (schedule) schedule.style.display = "block";
    renderSelectedSchedule();
    window.scrollTo({top:0,behavior:"smooth"});
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
    selectedWeek = 0;
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
