(function () {
  const FILE_URL = "https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/Shift.xlsx";
  const DAYS = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
  const WEEK_START = new Date(2026, 9, 19);
  let views = [], active = 0, loaded = false;
  const norm = v => String(v == null ? "" : v).toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
  const clean = v => String(v == null ? "" : v).trim();
  const esc = v => clean(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  function dayName(v) {
    const n=norm(v), aliases={pzt:"Pazartesi",pazartesi:"Pazartesi",sal:"Salı",sali:"Salı",cars:"Çarşamba",carsamba:"Çarşamba",per:"Perşembe",persembe:"Perşembe",cuma:"Cuma",cum:"Cuma",cts:"Cumartesi",cumartesi:"Cumartesi",paz:"Pazar",pazar:"Pazar"};
    return aliases[n] || DAYS.find(d=>n===norm(d) || n.startsWith(norm(d)) || n.endsWith(norm(d))) || null;
  }
  function isWeek43(v) {
    const s=String(v == null ? "" : v);
    return /(^|[^0-9])w\s*43([^0-9]|$)/i.test(s) || /(^|[^0-9])week\s*43([^0-9]|$)/i.test(s) || /(^|[^0-9])43\s*\.?\s*(hafta|week)([^0-9]|$)/i.test(s) || /19[./-]10[./-]2026/.test(s) || /2026[./-]10[./-]19/.test(s) || /^(w43|week43|43hafta|43haftasi)$/.test(norm(s));
  }
  function extractWeek43(rows) {
    const start=rows.findIndex(row=>(row||[]).some(isWeek43));
    if(start<0)return [];
    let end=rows.length;
    for(let i=start+1;i<rows.length;i++){
      if((rows[i]||[]).some(v=>/^(w\s*\d+|week\s*\d+|\d+\.?\s*hafta)/i.test(clean(v)) && !isWeek43(v))){end=i;break;}
    }
    return rows.slice(start,end);
  }
  function dateLabel(day) {
    const i=DAYS.indexOf(day), d=new Date(WEEK_START); d.setDate(d.getDate()+i);
    return String(d.getDate()).padStart(2,"0")+"."+String(d.getMonth()+1).padStart(2,"0")+"."+d.getFullYear();
  }
  function render() {
    const tabs=document.getElementById("shiftProgramDays"), table=document.getElementById("shiftProgramTable"), status=document.getElementById("shiftProgramStatus");
    if(!table||!views.length)return;
    if(tabs)tabs.innerHTML="";
    table.innerHTML=views.map(v=>'<section class="shift-week-day"><h2>'+esc(v.day)+' <small>'+esc(v.date)+'</small></h2>'+(v.people.length?'<div class="shift-staff-list">'+v.people.map(p=>'<article class="shift-staff-card"><h3>'+esc(p.name)+'</h3><div class="shift-staff-details">'+p.details.map(d=>'<span>'+esc(d)+'</span>').join("")+'</div></article>').join("")+'</div>':'<div class="shift-day-empty">—</div>')+'</section>').join("");
    if(status)status.textContent="";
  }
  const STAFF = ["Berat","Sinem","Serkan","Cem","Merve","Ecenur"];
  function staffName(row, firstDayCol) {
    const before=(row||[]).slice(0,firstDayCol).map(clean).filter(Boolean);
    const all=before.join(" ");
    const match=STAFF.find(n=>norm(all).includes(norm(n)));
    if(match)return match;
    // If the sheet has a name column but uses a different spelling/case, retain its first useful cell.
    return before.find(v=>/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(v) && !dayName(v)) || "";
  }
  function timeDetails(cells) {
    const out=[];
    (cells||[]).map(clean).filter(Boolean).forEach(value=>{
      // Keep only schedule/break entries; discard explanatory notes and headings.
      const parts=value.split(/\\r?\\n|;|\\|/).map(clean).filter(Boolean);
      parts.forEach(part=>{
        if(!/\\d{1,2}[:.]\\d{2}/.test(part))return;
        if(!out.includes(part))out.push(part);
      });
    });
    return out;
  }
  function createViews(dayCols, rows, headerIndex) {
    const firstDayCol=Math.min.apply(null,dayCols.map(x=>x.col));
    const ordered=dayCols.slice().sort((a,b)=>a.col-b.col);
    const parsed=[];
    ordered.forEach((x,dayIndex)=>{
      const next=ordered[dayIndex+1];
      const end=next?next.col:Math.max.apply(null,rows.map(r=>r.length).concat([x.col+1]));
      const people=[];
      rows.slice(headerIndex+1).forEach(row=>{
        const name=staffName(row,firstDayCol);
        if(!name)return;
        const cells=(row||[]).slice(x.col,end);
        const details=timeDetails(cells);
        // Keep every employee listed for every day, even if their cells contain no shift time.
        if(!people.some(p=>norm(p.name)===norm(name)))people.push({name,details});
      });
      parsed.push({day:x.day,date:dateLabel(x.day),people});
    });
    parsed.forEach(v=>views.push(v));
  }
  function parseWeek(rows) {
    // Column layout: prefer a genuine weekday header spanning most of the week.
    let best=-1, matches=[];
    for(let r=0;r<Math.min(rows.length,80);r++){
      const found=[];
      (rows[r]||[]).forEach((v,c)=>{const d=dayName(v);if(d)found.push({day:d,col:c});});
      const unique=found.filter((x,i,a)=>a.findIndex(y=>y.day===x.day)===i);
      if(unique.length>matches.length){best=r;matches=unique;}
    }
    if(best>=0 && matches.length>=5){
      createViews(matches,rows,best);
      return views.length>0;
    }
    // Vertical layout: a weekday/date heading followed by employee rows.
    let current=null;
    rows.forEach(row=>{
      const cells=(row||[]).map(clean);
      const nonempty=cells.filter(Boolean);
      if(!nonempty.length)return;
      const day=nonempty.map(dayName).find(Boolean);
      const hasTime=nonempty.some(v=>/\\d{1,2}[:.]\\d{2}/.test(v));
      if(day && !hasTime && nonempty.length<=3){
        current={day,date:dateLabel(day),people:[]};
        views.push(current);
        return;
      }
      if(current){
        const name=STAFF.find(n=>norm(nonempty.join(" ")).includes(norm(n))) || clean(cells[0]);
        if(!name)return;
        const details=timeDetails(cells.slice(1));
        const existing=current.people.find(p=>norm(p.name)===norm(name));
        if(existing)details.forEach(d=>{if(!existing.details.includes(d))existing.details.push(d);});
        else current.people.push({name,details});
      }
    });
    return views.length>0;
  }
  function chooseDefaultDay(){
    const now=new Date(), start=new Date(2026,9,19), end=new Date(2026,9,26);
    const idx=now>=start&&now<end?(now.getDay()===0?6:now.getDay()-1):0;
    const target=DAYS[idx]; active=Math.max(0,views.findIndex(v=>v.day===target));
  }
  window.selectShiftProgramDay=function(i){if(i<0||i>=views.length)return;active=i;render();};
  window.showShiftProgram=function(){
    ["mainMenu","productSearchArea","sizeSearchArea","educationArea","dailyTasksArea","vmStandardsArea","sdKarneArea"].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display="none";});
    const area=document.getElementById("shiftProgramArea");if(area)area.style.display="block";
    if(!loaded)load();else render();
    window.scrollTo({top:0,behavior:"smooth"});
  };
  window.closeShiftProgram=function(){const e=document.getElementById("shiftProgramArea");if(e)e.style.display="none";if(typeof showMainMenu==="function")showMainMenu();};
  async function load(){
    const status=document.getElementById("shiftProgramStatus");
    try{
      if(!window.XLSX)throw new Error("Excel görüntüleyici yüklenemedi.");
      const response=await fetch(FILE_URL+"?v="+Date.now(),{cache:"no-store"});if(!response.ok)throw new Error("Excel indirilemedi.");
      const wb=XLSX.read(await response.arrayBuffer(),{type:"array",cellDates:true});
      // Only read a sheet explicitly labelled W43, or the W43 section in a combined sheet.
      const dedicatedWeekFile=/\/Shift\.xlsx(?:\?|$)/i.test(FILE_URL);
      const named=wb.SheetNames.filter(n=>isWeek43(n));
      const sheets=(dedicatedWeekFile ? wb.SheetNames : (named.length?named:wb.SheetNames)).map(name=>({name,rows:XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:"",raw:false})}));
      for(const sheet of sheets){
        views=[];
        const rows=/\/Shift\.xlsx(?:\?|$)/i.test(FILE_URL) ? sheet.rows : (named.length ? sheet.rows : extractWeek43(sheet.rows));
        if(!rows.length)continue;
        if(parseWeek(rows))break;
        views=[];
      }
      if(!views.length)throw new Error("W43 bölümü bulunamadı.");
      views.sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day));
      views=views.filter((v,i,a)=>a.findIndex(x=>x.day===v.day)===i);
      // Always render the complete Monday-Sunday week, not just the last parsed date.
      DAYS.forEach(day=>{
        if(!views.some(v=>v.day===day))views.push({day,date:dateLabel(day),people:[]});
      });
      views.forEach(view=>{
        const parsed=view.people.slice();
        view.people=STAFF.map(name=>{
          const found=parsed.find(p=>norm(p.name).includes(norm(name)) || norm(name).includes(norm(p.name)));
          return found ? {name,details:found.details} : {name,details:[]};
        });
      });
      views.sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day));
      chooseDefaultDay();loaded=true;render();
    }catch(err){
      console.error("W43 programı okunamadı:",err);
      if(status)status.textContent="";
      const table=document.getElementById("shiftProgramTable");
      if(table)table.innerHTML='<p class="shift-program-empty">Program yüklenemedi.</p>';
    }
  }
})();