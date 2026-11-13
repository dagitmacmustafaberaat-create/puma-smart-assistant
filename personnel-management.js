/* BUYAKA PUMA — PERSONEL YÖNETİM MERKEZİ */
(function(){
  const STAFF=["Sinem Palaz","Serkan Canik","Cem Aktaş","Merve Çetin","Ecenur Temür"];
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num=(v,d=0)=>new Intl.NumberFormat("tr-TR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number(v)||0);
  const money=v=>num(v,0)+" TL";
  const pct=v=>"%"+num(v,1);
  let loaded=false,activeWeek=0,activeShiftPerson=null;
  function status(message){const el=$("pmxStatus");if(el)el.textContent=message;}
  function summary(items){return '<div class="pmx-statline">'+items.map(x=>'<article class="pmx-stat"><span>'+esc(x.label)+'</span><strong>'+esc(x.value)+'</strong></article>').join("")+'</div>';}
  function renderSD(){
    const root=$("pmxSdData"),rows=(window.BUYAKA_SD_KARNE_ROWS||[]).filter(p=>STAFF.includes(p.name));
    if(!root)return;
    if(!rows.length){root.innerHTML='<div class="pmx-empty">SD Karne raporundaki personel verileri yüklenemedi. Excel kaynağını kontrol edin.</div>';return;}
    const total=rows.reduce((n,p)=>n+Number(p.ciro||0),0);
    const avgUpt=rows.reduce((n,p)=>n+Number(p.upt||0),0)/rows.length;
    const avgCr=rows.reduce((n,p)=>n+Number(p.cr||0),0)/rows.length;
    const cards=rows.slice().sort((a,b)=>Number(b.ciro||0)-Number(a.ciro||0)).map((p,i)=>{
      const metrics=[
        ["CİRO",money(p.ciro)],["FATURA",p.hasInvoices?num(p.invoices):"—"],["ÜRÜN",p.hasProducts?num(p.products):"—"],
        ["ATV",p.atv?money(p.atv):"—"],["ASP",p.asp?money(p.asp):"—"],["UPT",num(p.upt,2)],
        ["CR",num(p.cr,2)+"%"],["AY SONU KAPANIŞ",p.closingRevenue?money(p.closingRevenue):"—"],["HGO",p.hgo?pct(p.hgo):"—"]
      ];
      return '<article class="pmx-person-card"><header class="pmx-person-card-head"><span class="pmx-rank">#'+(i+1)+'</span><div><strong>'+esc(p.name)+'</strong><small>PERSONEL PERFORMANS KARNESİ</small></div><span class="pmx-bonus"><small>AY SONU KAZANÇ</small><b>'+money(p.bonus)+'</b></span></header><div class="pmx-metrics-grid">'+metrics.map(m=>'<div class="pmx-metric"><span>'+m[0]+'</span><strong>'+esc(m[1])+'</strong></div>').join("")+'</div></article>';
    }).join("");
    root.innerHTML=summary([{label:"EKİP CİROSU",value:money(total)},{label:"ORTALAMA UPT",value:num(avgUpt,2)},{label:"ORTALAMA CR",value:num(avgCr,2)+"%"}])+'<div class="pmx-person-grid">'+cards+'</div>';
  }
  function renderLeague(){
    const root=$("pmxLeagueData"),data=window.BUYAKA_LEAGUE_DATA;
    if(!root)return;
    if(!data||!Array.isArray(data.staff)||!data.staff.length){root.innerHTML='<div class="pmx-empty">Kasım personel hedef ve gerçekleşme verileri yüklenemedi.</div>';return;}
    const ranked=data.staff.filter(p=>STAFF.includes(p.name)).map(p=>{
      const invoiceRate=p.invoiceTarget?Number(p.invoices||0)/p.invoiceTarget*100:0;
      const unitRate=p.unitTarget?Number(p.units||0)/p.unitTarget*100:0;
      return Object.assign({},p,{invoiceRate,unitRate,score:(invoiceRate+unitRate)/2});
    }).sort((a,b)=>b.score-a.score);
    const totalInvoices=ranked.reduce((n,p)=>n+Number(p.invoices||0),0),totalUnits=ranked.reduce((n,p)=>n+Number(p.units||0),0);
    const totalInvoiceTarget=ranked.reduce((n,p)=>n+Number(p.invoiceTarget||0),0),totalUnitTarget=ranked.reduce((n,p)=>n+Number(p.unitTarget||0),0);
    const month=String(data.month||"2026-11").replace("-"," / ");
    const cards=ranked.map((p,i)=>{
      const invWidth=Math.max(0,Math.min(100,p.invoiceRate)),unitWidth=Math.max(0,Math.min(100,p.unitRate));
      return '<article class="pmx-league-card '+(i===0?"is-leader":"")+'"><div class="pmx-league-card-top"><span class="pmx-rank">'+(i===0?"🏆 1":"#"+(i+1))+'</span><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.role||"SALES ADVISOR")+'</small></div><b class="pmx-score">'+pct(p.score)+'</b></div><div class="pmx-progress-block"><div><span>FATURA HEDEFİ</span><b>'+num(p.invoices)+' / '+num(p.invoiceTarget)+' · '+pct(p.invoiceRate)+'</b></div><i><span style="width:'+invWidth+'%"></span></i></div><div class="pmx-progress-block"><div><span>ÜRÜN HEDEFİ</span><b>'+num(p.units)+' / '+num(p.unitTarget)+' · '+pct(p.unitRate)+'</b></div><i><span style="width:'+unitWidth+'%"></span></i></div><div class="pmx-daily-line"><span>GÜNLÜK HEDEF</span><b>'+num(p.dailyInvoice,1)+' FATURA</b><b>'+num(p.dailyUnits,1)+' ÜRÜN</b></div></article>';
    }).join("");
    root.innerHTML=summary([{label:"FATURA GERÇEKLEŞMESİ",value:num(totalInvoices)+" / "+num(totalInvoiceTarget)},{label:"ÜRÜN GERÇEKLEŞMESİ",value:num(totalUnits)+" / "+num(totalUnitTarget)},{label:"AYIN LİDERİ",value:ranked[0]?.name||"—"}])+'<div class="pmx-panel-note">'+esc(month)+' · Skor: fatura hedefi %50 + ürün hedefi %50</div><div class="pmx-league-grid">'+cards+'</div>';
  }
  function renderWeekly(){
    const root=$("pmxWeeklyData"),rows=(window.BUYAKA_SD_KARNE_ROWS||[]).filter(p=>STAFF.includes(p.name)),league=window.BUYAKA_LEAGUE_DATA?.staff||[];
    if(!root)return;
    if(!rows.length){root.innerHTML='<div class="pmx-empty">Şampiyonları belirlemek için SD Karne verisi gerekli.</div>';return;}
    const enriched=rows.map(p=>{const sale=league.find(x=>x.name===p.name),invoices=Number(sale?.invoices)||Number(p.invoices)||0;return Object.assign({},p,{atv:invoices?Number(p.ciro||0)/invoices:0});});
    const specs=[{key:"ciro",title:"CİRO ŞAMPİYONU",icon:"💰",format:p=>money(p.ciro)},{key:"upt",title:"UPT ŞAMPİYONU",icon:"⚡",format:p=>num(p.upt,2)+" UPT"},{key:"atv",title:"ATV ŞAMPİYONU",icon:"🛒",format:p=>money(p.atv)},{key:"cr",title:"CR ŞAMPİYONU",icon:"🎯",format:p=>num(p.cr,2)+"%"}];
    const cards=specs.map(s=>{
      const pool=s.key==="atv"?enriched.filter(p=>p.atv>0):enriched;
      const winner=pool.length?pool.reduce((a,b)=>Number(b[s.key]||0)>Number(a[s.key]||0)?b:a):null;
      return '<article class="pmx-champion-card"><span class="pmx-champion-icon">'+s.icon+'</span><small>'+s.title+'</small><strong>'+(winner?esc(winner.name):"VERİ YOK")+'</strong><b>'+(winner?esc(s.format(winner)):"—")+'</b><span class="pmx-champion-caption">BUYAKA PUMA · PERFORMANS LİDERİ</span></article>';
    }).join("");
    root.innerHTML='<div class="pmx-champion-grid">'+cards+'</div>';
  }
  function renderEducation(){
    const root=$("pmxEducationData"),data=window.BUYAKA_TRAINING_DATA;
    if(!root)return;
    if(!data){root.innerHTML='<div class="pmx-empty">Kasım eğitim takvimi yüklenemedi.</div>';return;}
    const calendar=data.calendar||{},dates=Object.keys(calendar).sort(),resources=data.library||[];
    const today=new Date(),todayKey=today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");
    const selected=dates.includes(todayKey)?todayKey:(dates.find(d=>d>=todayKey)||dates[0]||"");
    const options=dates.map(d=>'<option value="'+esc(d)+'" '+(d===selected?"selected":"")+'>'+d.split("-").reverse().join(".")+'</option>').join("");
    const docs=resources.map(r=>'<button type="button" class="pmx-resource-card" onclick="openTrainingResource(\''+String(r.file||"").replace(/\\/g,"\\\\").replace(/'/g,"\\'")+'\')"><span>'+esc(r.icon||"📘")+'</span><div><small>'+esc(r.group||"EĞİTİM")+'</small><strong>'+esc(r.title)+'</strong></div><b>↗</b></button>').join("");
    root.innerHTML=summary([{label:"EĞİTİM GÜNÜ",value:String(dates.length)},{label:"EĞİTİM DOKÜMANI",value:String(resources.length)},{label:"TAKVİM DÖNEMİ",value:"KASIM 2026"}])+'<div class="pmx-education-layout"><section class="pmx-education-day"><div class="pmx-section-head"><div><small>GÜNLÜK GELİŞİM PLANI</small><h3>Eğitim takvimi</h3></div><select id="pmxEducationDate" class="pmx-select" onchange="window.renderPersonnelEducationDay(this.value)">'+options+'</select></div><div id="pmxEducationDay"></div></section><section class="pmx-education-library"><div class="pmx-section-head"><div><small>ÖĞRENME KÜTÜPHANESİ</small><h3>Eğitim dokümanları</h3></div></div><div class="pmx-resource-grid">'+docs+'</div></section></div>';
    if(selected)renderEducationDay(selected);
  }
  function renderEducationDay(date){
    const root=$("pmxEducationDay"),data=window.BUYAKA_TRAINING_DATA?.calendar?.[date];
    if(!root)return;
    if(!data){root.innerHTML='<div class="pmx-empty">Bu tarih için eğitim içeriği bulunmuyor.</div>';return;}
    const groups=[{title:"VM & SATIŞ TEKNİKLERİ",icon:"🧭",items:data.vmSales||data.vm||[]},{title:"ÜRÜN TEKNOLOJİLERİ",icon:"👟",items:data.technology||data.tech||[]},{title:"SAHA UYGULAMASI",icon:"🎯",items:data.practice||[]}];
    root.innerHTML='<div class="pmx-training-date">'+esc(date.split("-").reverse().join("."))+'</div><div class="pmx-training-topics">'+groups.map(g=>'<article><span>'+g.icon+'</span><div><small>'+g.title+'</small><strong>'+esc(Array.isArray(g.items)?g.items.join(" · "):g.items||"—")+'</strong></div></article>').join("")+'</div>';
  }
  function renderShift(){
    const root=$("pmxShiftData"),data=window.BUYAKA_SHIFT_DATA;
    if(!root)return;
    if(!data?.weeks?.length||!data?.staff?.length){root.innerHTML='<div class="pmx-empty">Çalışma programı verisi yüklenemedi.</div>';return;}
    const weeks=data.weeks,select=$("pmxShiftWeek");
    if(select&&select.dataset.ready!=="1"){select.innerHTML=weeks.map((w,i)=>'<option value="'+i+'">'+esc(w.label+" · "+w.range)+'</option>').join("");select.dataset.ready="1";}
    activeWeek=Math.min(activeWeek,weeks.length-1);
    if(select)select.value=String(activeWeek);
    const staff=data.staff;
    const roster=staff.map((p,i)=>'<button type="button" class="pmx-shift-person '+(activeShiftPerson===i?"active":"")+'" onclick="window.selectPersonnelShiftStaff('+i+')"><span class="pmx-shift-avatar">'+(i===0?"🧢":i===1?"📣":"🏃")+'</span><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.role)+'</small></span><b>›</b></button>').join("");
    const selected=activeShiftPerson===null?null:staff[activeShiftPerson];
    let schedule='<div class="pmx-shift-prompt">Haftalık vardiyasını görüntülemek için yukarıdan bir ekip kartı seç.</div>';
    if(selected){
      const week=weeks[activeWeek];
      const days=week.days.map((day)=>{
        const sh=day.shifts[activeShiftPerson]||[];
        const off=sh[0]==="00:00"&&sh[1]==="00:00";
        return '<article class="pmx-shift-day '+(off?"is-off":"")+'"><div><small>'+esc(day.day)+'</small><strong>'+esc(day.date)+'</strong></div>'+(off?'<b class="pmx-off-label">İZİNLİ</b>':'<div class="pmx-shift-hours"><strong>'+esc(sh[0]||"—")+' – '+esc(sh[1]||"—")+'</strong><small>NET '+esc(sh[4]||"—")+' · MOLA '+esc(sh[3]||"—")+'</small></div>')+'</article>';
      }).join("");
      schedule='<div class="pmx-selected-staff"><div><small>SEÇİLİ PERSONEL</small><strong>'+esc(selected.name)+'</strong><span>'+esc(week.label+" · "+week.range)+'</span></div><span class="pmx-shift-total">'+week.days.filter(d=>{const s=d.shifts[activeShiftPerson]||[];return s[0]!=="00:00"||s[1]!=="00:00";}).length+' GÜN GÖREVDE</span></div><div class="pmx-shift-days">'+days+'</div>';
    }
    root.innerHTML='<div class="pmx-shift-roster-wrap"><div class="pmx-section-head"><div><small>EKİP KADROSU</small><h3>Haftalık vardiya ekibi</h3></div><span class="pmx-roster-count">6 KİŞİ · MÜDÜR DAHİL</span></div><div class="pmx-shift-roster">'+roster+'</div></div>'+schedule;
  }
  window.renderPersonnelEducationDay=renderEducationDay;
  window.renderPersonnelShiftWeek=function(value){activeWeek=Number(value)||0;renderShift();};
  window.selectPersonnelShiftStaff=function(index){activeShiftPerson=Number(index);renderShift();};
  window.loadPersonnelManagementData=async function(force){
    if(!force&&loaded){renderAll();return;}
    status("Kasım raporları ve ekip verileri güncelleniyor…");
    const jobs=[];
    if(typeof window.loadSDKarneData==="function")jobs.push(window.loadSDKarneData());
    if(typeof window.loadLeagueData==="function")jobs.push(window.loadLeagueData());
    if(typeof window.loadTrainingCalendarWorkbook==="function")jobs.push(window.loadTrainingCalendarWorkbook());
    await Promise.allSettled(jobs);
    renderAll();loaded=true;
    status("Rapor verileri yenilendi · "+new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}));
  };
  function renderAll(){renderSD();renderLeague();renderWeekly();renderEducation();renderShift();}
  window.renderPersonnelManagement=renderAll;
  document.addEventListener("DOMContentLoaded",()=>{const select=$("pmxShiftWeek");if(select)select.addEventListener("change",()=>window.renderPersonnelShiftWeek(select.value));});
})();