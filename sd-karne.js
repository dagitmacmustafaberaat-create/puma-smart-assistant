const SD_KARNE_URL="https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/EK%C4%B0M%20SD%20KARNE.xlsx";
const SD_STAFF=["Sinem Palaz","Serkan Canik","Cem Aktaş","Merve Çetin","Ecenur Temür"];
let sdKarneRows=[];
function sdNorm(v){return String(v??"").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").replace(/\s+/g," ").trim();}
function sdNum(v){if(typeof v==="number")return Number.isFinite(v)?v:0;let s=String(v??"").trim().replace(/₺|tl/gi,"").replace(/\s/g,"");if(!s)return 0;if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",",".");else if(s.includes(","))s=s.replace(",",".");const n=Number(s.replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0;}
function sdMetricIndex(headers,type){
 const cells=headers.map((v,i)=>({i,t:sdNorm(v)}));
 const tests={
  bonus:x=>x.includes("ay sonu kazanc"),
  cr:x=>(x.includes("kisisel cr")||x==="cr"||x.includes("kisisel conversion")||x.includes("conversion rate"))&&!x.includes("hedef"),
  upt:x=>(x.includes("kisisel upt")||x==="upt"||x.includes("adet/fatura"))&&!x.includes("hedef"),
  ciro:x=>x.includes("ciro")&&!x.includes("hedef")&&!x.includes("fark")&&!x.includes("onceki")&&!x.includes("gecen yil")
 };
 let found=cells.filter(c=>tests[type](c.t));
 if(!found.length)return -1;
 if(type==="cr"||type==="upt"){const preferred=found.find(c=>c.t.includes("kisisel"));if(preferred)return preferred.i;}
 if(type==="ciro"){const preferred=found.find(c=>c.t.includes("gerceklesen")||c.t.includes("toplam"));if(preferred)return preferred.i;}
 return found[0].i;
}
function sdFindTable(book){
 let best=null;
 for(const sheetName of book.SheetNames){
  const rows=XLSX.utils.sheet_to_json(book.Sheets[sheetName],{header:1,defval:null,raw:true});
  const maxCols=Math.max(0,...rows.slice(0,120).map(r=>r.length));
  for(let r=0;r<Math.min(rows.length,120);r++){
   for(let span=1;span<=4&&r+span<=rows.length;span++){
    const headers=Array.from({length:maxCols},(_,c)=>{
     const parts=[];
     for(let k=0;k<span;k++){const v=rows[r+k]?.[c];if(v!==null&&v!==undefined&&String(v).trim())parts.push(String(v));}
     return parts.join(" ");
    });
    const map={ciro:sdMetricIndex(headers,"ciro"),upt:sdMetricIndex(headers,"upt"),cr:sdMetricIndex(headers,"cr"),bonus:sdMetricIndex(headers,"bonus")};
    const score=Object.values(map).filter(i=>i>=0).length;
    if(score>(best?best.score:0))best={rows,headerRow:r,headerSpan:span,map,score,sheetName};
    if(score===4)break;
   }
   if(best&&best.score===4)break;
  }
  if(best&&best.score===4)break;
 }
 if(!best||best.score<4) {
  const sheets=book.SheetNames.map(n=>{
   const rows=XLSX.utils.sheet_to_json(book.Sheets[n],{header:1,defval:null,raw:true});
   return n+": "+rows.slice(0,16).map((r,i)=>i+": "+(r||[]).filter(v=>v!==null&&v!==undefined&&String(v).trim()).join(" | ")).join(" || ");
  }).join(" ### ");
  throw new Error("Excel başlıkları eşleştirilemedi. Sayfa önizlemesi: "+sheets.slice(0,1600));
 }
 return best;
}
function sdReadData(book){
 const table=sdFindTable(book),out=[];
 for(const name of SD_STAFF){
  const key=sdNorm(name);
  const row=table.rows.find((r,i)=>i>table.headerRow&&r.some(v=>sdNorm(v)===key));
  if(!row)throw new Error(name+" için personel satırı bulunamadı.");
  const val=k=>table.map[k]>=0?sdNum(row[table.map[k]]):0;
  out.push({name,ciro:val("ciro"),upt:val("upt"),cr:val("cr"),bonus:val("bonus")});
 }
 return out;
}
function sdFmt(v,d=2){return new Intl.NumberFormat("tr-TR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number(v)||0);}
function sdWinner(items,key){return items.reduce((a,b)=>b[key]>a[key]?b:a,items[0]);}
function renderSDKarne(){
 if(!sdKarneRows.length)return;
 const winners=[
  {id:"sdUptWinner",label:"UPT ŞAMPİYONU",metric:"upt",unit:"UPT",icon:"⚡"},
  {id:"sdCrWinner",label:"CR ŞAMPİYONU",metric:"cr",unit:"CR",icon:"🎯"},
  {id:"sdCiroWinner",label:"CİRO ŞAMPİYONU",metric:"ciro",unit:"CİRO",icon:"💰"}
 ];
 winners.forEach(w=>{
  const p=sdWinner(sdKarneRows,w.metric),el=document.getElementById(w.id);
  if(el)el.innerHTML='<span class="sd-award-icon">'+w.icon+'</span><span class="sd-award-label">'+w.label+'</span><strong>'+p.name+'</strong><small>'+w.unit+' · '+(w.metric==="ciro"?sdFmt(p[w.metric],0)+" TL":sdFmt(p[w.metric],2))+'</small>';
 });
 const cards=document.getElementById("sdStaffCards");
 if(cards)cards.innerHTML=sdKarneRows.map(p=>'<article class="sd-staff-card"><div class="sd-staff-top"><h3>'+p.name+'</h3><span class="sd-bonus-chip">AY SONU KAZANÇ <strong>'+sdFmt(p.bonus,0)+' TL</strong></span></div><div class="sd-staff-metrics"><div><span>CİRO</span><strong>'+sdFmt(p.ciro,0)+' TL</strong></div><div><span>KİŞİSEL UPT</span><strong>'+sdFmt(p.upt,2)+'</strong></div><div><span>KİŞİSEL CR</span><strong>'+sdFmt(p.cr,2)+'%</strong></div></div></article>').join("");
}
async function loadSDKarneData(){
 const status=document.getElementById("sdKarneStatus");
 try{
  if(!window.XLSX)throw new Error("Excel okuma kütüphanesi yüklenemedi.");
  if(status)status.textContent="SD Karne verileri yükleniyor…";
  const response=await fetch(SD_KARNE_URL+"?v="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw new Error("GitHub Excel dosyasına erişilemedi ("+response.status+").");
  const book=XLSX.read(await response.arrayBuffer(),{type:"array",cellDates:false});
  sdKarneRows=sdReadData(book);
  renderSDKarne();
  if(status)status.textContent="✓ Ekim 2026 SD Karne verileri güncel olarak yüklendi.";
 }catch(error){
  console.error("SD Karne yükleme hatası:",error);
  if(status)status.textContent="Veriler yüklenemedi: "+error.message;
  const cards=document.getElementById("sdStaffCards");
  if(cards)cards.innerHTML='<div class="league-empty">'+error.message+'</div>';
 }
}
function toggleSDKarneExcel(){
 const wrap=document.getElementById("sdKarneViewerWrap");
 const viewer=document.getElementById("sdKarneViewer");
 if(!wrap)return;
 const opening=wrap.hidden;
 wrap.hidden=!opening;
 if(opening&&viewer&&!viewer.src){
  const fileUrl=SD_KARNE_URL+"?v=20261104";
  viewer.src="https://view.officeapps.live.com/op/embed.aspx?src="+encodeURIComponent(fileUrl);
 }
}
