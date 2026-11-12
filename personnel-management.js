/* BUYAKA PUMA — PERSONEL YÖNETİM MERKEZİ VERİ KATMANI */
(function(){
  const STAFF = ["Sinem Palaz","Serkan Canik","Cem Aktaş","Merve Çetin","Ecenur Temür"];
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const number = (value,d=0) => new Intl.NumberFormat("tr-TR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number(value)||0);
  const money = value => number(value,0)+" TL";
  const pct = value => "%"+number(value,1);
  const panel = name => document.querySelector('#personnelManagementArea [data-pmx-panel="'+name+'"]');
  let loaded = false;
  let activeWeek = 0;

  function setStatus(name,message){
    const el=$("pmxStatus");
    if(el)el.textContent=message;
  }
  function table(headers,rows){
    return '<div class="pmx-table-wrap"><table class="pmx-table"><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  function renderSD(){
    const root=$("pmxSdData"),rows=window.BUYAKA_SD_KARNE_ROWS||[];
    if(!root)return;
    if(!rows.length){root.innerHTML='<div class="pmx-empty">SD Karne Excel verisi okunamadı. Mevcut SD Karne modülündeki veri kaynağını kontrol et.</div>';return;}
    const body=rows.filter(p=>STAFF.includes(p.name)).map(p=>'<tr><td>'+esc(p.name)+'</td><td>'+money(p.ciro)+'</td><td>'+number(p.upt,2)+'</td><td>'+number(p.cr,2)+'%</td><td>'+money(p.bonus)+'</td></tr>').join("");
    root.innerHTML='<div class="pmx-statline"><div class="pmx-stat"><span>PERSONEL</span><strong>'+rows.filter(p=>STAFF.includes(p.name)).length+'</strong></div><div class="pmx-stat"><span>TOPLAM CİRO</span><strong>'+money(rows.filter(p=>STAFF.includes(p.name)).reduce((n,p)=>n+Number(p.ciro||0),0))+'</strong></div><div class="pmx-stat"><span>ORTALAMA UPT</span><strong>'+number(rows.filter(p=>STAFF.includes(p.name)).reduce((n,p)=>n+Number(p.upt||0),0)/STAFF.length,2)+'</strong></div></div>'+
      table(["PERSONEL","GERÇEKLEŞEN CİRO","UPT","KİŞİSEL CR","AY SONU KAZANÇ"],body);
  }
  function renderLeague(){
    const root=$("pmxLeagueData"),data=window.BUYAKA_LEAGUE_DATA;
    if(!root)return;
    if(!data?.staff?.length){root.innerHTML='<div class="pmx-empty">Performance League hedef Excel verisi yüklenemedi.</div>';return;}
    const ranked=data.staff.filter(p=>STAFF.includes(p.name)).map(p=>{
      const invoiceRate=p.invoiceTarget?p.invoices/p.invoiceTarget*100:0;
      const unitRate=p.unitTarget?p.units/p.unitTarget*100:0;
      return {...p,score:(invoiceRate+unitRate)/2,invoiceRate,unitRate};
    }).sort((a,b)=>b.score-a.score);
    const totalInvoices=ranked.reduce((n,p)=>n+p.invoices,0),totalUnits=ranked.reduce((n,p)=>n+p.units,0);
    const totalInvoiceTarget=ranked.reduce((n,p)=>n+p.invoiceTarget,0),totalUnitTarget=ranked.reduce((n,p)=>n+p.unitTarget,0);
    const leader=ranked[0];
    const body=ranked.map((p,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(p.name)+'</td><td>'+number(p.invoiceTarget)+'</td><td>'+number(p.invoices)+'</td><td>'+pct(p.invoiceRate)+'</td><td>'+number(p.unitTarget)+'</td><td>'+number(p.units)+'</td><td>'+pct(p.unitRate)+'</td><td><strong>'+pct(p.score)+'</strong></td></tr>').join("");
    root.innerHTML='<div class="pmx-statline"><div class="pmx-stat"><span>FATURA</span><strong>'+number(totalInvoices)+' / '+number(totalInvoiceTarget)+'</strong></div><div class="pmx-stat"><span>ÜRÜN</span><strong>'+number(totalUnits)+' / '+number(totalUnitTarget)+'</strong></div><div class="pmx-stat"><span>AYIN LİDERİ</span><strong style="font-size:14px">'+esc(leader?.name||"—")+'</strong></div></div>'+
      '<p class="pmx-note" style="margin:0 0 10px">'+esc(String(data.month||"").replace("-"," / "))+' · Puan: fatura hedefi %50 + ürün hedefi %50</p>'+
      table(["SIRA","PERSONEL","FATURA HEDEF","FATURA","FATURA %","ÜRÜN HEDEF","ÜRÜN","ÜRÜN %","PUAN"],body);
  }
  function renderWeekly(){
    const root=$("pmxWeeklyData"),products=window.BUYAKA_WEEKLY_WINNERS||{},rows=window.BUYAKA_SD_KARNE_ROWS||[];
    if(!root)return;
    const winner=(key)=>{const metric=key==="revenue"?"ciro":"upt";const list=rows.filter(p=>STAFF.includes(p.name));return list.length?list.reduce((a,b)=>Number(b[metric])>Number(a[metric])?b:a):null;};
    const revenue=winner("revenue"),upt=winner("upt");
    const product=(key)=>products[key]||null;
    const textile=product("textile"),footwear=product("footwear");
    const itemRow=(title,person,detail)=>'<div class="pmx-row"><strong>'+esc(title)+'</strong><span class="pmx-row-detail">'+esc(person||"Veri yok")+'</span><span class="pmx-tag">'+esc(detail||"—")+'</span></div>';
    root.innerHTML='<div class="pmx-list">'+
      itemRow("Ciro şampiyonu",revenue?.name,revenue?money(revenue.ciro):"SD Karne verisi yok")+
      itemRow("UPT şampiyonu",upt?.name,upt?number(upt.upt,2)+" UPT":"SD Karne verisi yok")+
      itemRow("Tekstil ürün lideri",textile?.name,textile?textile.name+" · "+number(textile.units)+" adet":"Top20 verisi yok")+
      itemRow("Ayakkabı ürün lideri",footwear?.name,footwear?footwear.name+" · "+number(footwear.units)+" adet":"Top20 verisi yok")+
      '</div><p class="pmx-footer">Ürün liderleri mevcut Haftanın Enleri modülünde tanımlı haftalık Top20 sonuçlarıdır.</p>';
  }
  function renderEducation(){
    const root=$("pmxEducationData"),data=window.BUYAKA_TRAINING_DATA;
    if(!root)return;
    if(!data){root.innerHTML='<div class="pmx-empty">Eğitim takvimi verisi yüklenemedi.</div>';return;}
    const dates=Object.keys(data.calendar||{}).sort();
    const resources=data.library||[];
    const today=new Date();const todayKey=today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");
    const selected=dates.includes(todayKey)?todayKey:(dates.find(d=>d>=todayKey)||dates[0]);
    const dateOptions=dates.map(d=>'<option value="'+esc(d)+'" '+(d===selected?"selected":"")+'>'+d.split("-").reverse().join(".")+'</option>').join("");
    const resourceRows=resources.map(r=>'<tr><td>'+esc(r.title)+'</td><td>'+esc(r.group)+'</td><td><button type="button" class="pmx-link-button" onclick="openTrainingResource(\''+esc(r.file).replace(/'/g,"&#39;")+'\')">Aç</button></td></tr>').join("");
    root.innerHTML='<div class="pmx-statline"><div class="pmx-stat"><span>EĞİTİM GÜNÜ</span><strong>'+dates.length+'</strong></div><div class="pmx-stat"><span>KAYNAK DOKÜMAN</span><strong>'+resources.length+'</strong></div><div class="pmx-stat"><span>TAKVİM</span><strong style="font-size:14px">2026</strong></div></div>'+
      '<div class="pmx-panel-title"><div><h2>Günlük eğitim içeriği</h2><p>Tarihe göre mevcut eğitim planını görüntüle.</p></div><select id="pmxEducationDate" class="pmx-select" onchange="window.renderPersonnelEducationDay(this.value)">'+dateOptions+'</select></div>'+
      '<div id="pmxEducationDay" class="pmx-list"></div>'+
      '<div class="pmx-panel-title" style="margin-top:22px"><div><h2>Eğitim dokümanları</h2><p>Mevcut eğitim kütüphanesi.</p></div></div>'+
      table(["DOKÜMAN","KATEGORİ","İŞLEM"],resourceRows);
    window.renderPersonnelEducationDay(selected);
  }
  function renderEducationDay(date){
    const root=$("pmxEducationDay"),data=window.BUYAKA_TRAINING_DATA?.calendar?.[date];
    if(!root)return;
    if(!data){root.innerHTML='<div class="pmx-empty">Seçilen tarih için eğitim içeriği bulunamadı.</div>';return;}
    const groups=[["VM VE SATIŞ",data.vmSales],["TEKNOLOJİ",data.technology],["UYGULAMA",data.practice]];
    root.innerHTML=groups.map(([title,items])=>'<div class="pmx-row"><strong>'+esc(title)+'</strong><span class="pmx-row-detail">'+(items||[]).map(esc).join("<br>")+'</span><span class="pmx-tag">'+((items||[]).length)+" konu</span></div>").join("");
  }
  function renderShift(){
    const root=$("pmxShiftData"),data=window.BUYAKA_SHIFT_DATA;
    if(!root)return;
    if(!data?.weeks?.length){root.innerHTML='<div class="pmx-empty">Çalışma programı verisi yüklenemedi.</div>';return;}
    const weeks=data.weeks;
    const select=$("pmxShiftWeek");
    if(select&&!select.options.length)select.innerHTML=weeks.map((w,i)=>'<option value="'+i+'">'+esc(w.label+" · "+w.range)+'</option>').join("");
    if(select)select.value=String(Math.min(activeWeek,weeks.length-1));
    const week=weeks[Math.min(activeWeek,weeks.length-1)];
    const staff=data.staff||[];
    const headers=["PERSONEL",...week.days.map(d=>d.day.toLocaleUpperCase("tr-TR"))];
    const body=staff.map((p,i)=>{
      const cells=week.days.map(day=>{
        const sh=day.shifts[i]||[];
        const off=sh[0]==="00:00"&&sh[1]==="00:00";
        return '<td>'+(off?'<span class="pmx-tag">İZİNLİ</span>':esc((sh[0]||"")+"–"+(sh[1]||""))+'<br><small class="pmx-muted">NET '+esc(sh[4]||"—")+'</small>')+'</td>';
      }).join("");
      return '<tr><td>'+esc(p.name)+'</td>'+cells+'</tr>';
    }).join("");
    root.innerHTML='<p class="pmx-note" style="margin:0 0 10px">'+esc(week.label+" · "+week.range)+' · '+staff.length+' kişi (yönetici vardiya planında dahil)</p>'+table(headers,body);
  }
  window.renderPersonnelEducationDay=renderEducationDay;
  window.renderPersonnelShiftWeek=function(value){activeWeek=Number(value)||0;renderShift();};
  window.loadPersonnelManagementData=async function(force){
    if(!force&&loaded){renderAll();return;}
    setStatus("Mevcut modüllerin veri kaynakları okunuyor…");
    const jobs=[];
    if(typeof window.loadSDKarneData==="function")jobs.push(window.loadSDKarneData().catch(()=>[]));
    if(typeof window.loadLeagueData==="function")jobs.push(window.loadLeagueData().catch(()=>null));
    await Promise.all(jobs);
    renderAll();
    loaded=true;
    setStatus("Mevcut SD Karne ve Performance League Excel verileri güncellendi.");
  };
  function renderAll(){renderSD();renderLeague();renderWeekly();renderEducation();renderShift();}
  window.renderPersonnelManagement=renderAll;
  document.addEventListener("DOMContentLoaded",()=>{const select=$("pmxShiftWeek");if(select)select.addEventListener("change",()=>window.renderPersonnelShiftWeek(select.value));});
})();