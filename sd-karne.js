const SD_KARNE_URL="https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/SD%20Karne.xlsx";
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
 const sheetName=book.SheetNames.find(n=>sdNorm(n)==="sd karne")||book.SheetNames[0];
 const rows=XLSX.utils.sheet_to_json(book.Sheets[sheetName],{header:1,defval:null,raw:true});
 // SD KARNE sayfasında personel tablosunun başlıkları 12. satırda (0-based index 11).
 const headerRow=11, headers=rows[headerRow]||[];
 const findHeader=(name)=>headers.findIndex(v=>sdNorm(v)===sdNorm(name));
 const map={
  upt:findHeader("UPT"),
  ciro:findHeader("GERÇEKLEŞEN CİRO"),
  bonus:findHeader("AYSONU KAZANÇ"),
  cr:findHeader("KİŞİSEL CR")
 };
 const missing=Object.entries(map).filter(([,i])=>i<0).map(([k])=>k);
 if(missing.length)throw new Error("SD KARNE sayfasında 12. satırdaki başlıklarda şu alanlar bulunamadı: "+missing.join(", "));
 return {rows,headerRow,map,sheetName};
}
function sdReadData(book){
 const table=sdFindTable(book),out=[];
 for(const name of SD_STAFF){
  const key=sdNorm(name);
  const row=table.rows.find((r,i)=>i>table.headerRow&&r.some(v=>sdNorm(v)===key));
  if(!row)throw new Error(name+" için personel satırı bulunamadı.");
  const val=k=>sdNum(row[table.map[k]]);
  let cr=val("cr");
  // Excel yüzde hücreleri 0,08 olarak saklanıyorsa ekranda 8,00% göster.
  if(cr>0&&cr<=1)cr*=100;
  out.push({name,ciro:val("ciro"),upt:val("upt"),cr,bonus:val("bonus")});
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
  if(!el)return;
  const maleNames=["Cem Aktaş","Serkan Canik"];
  const isMale=maleNames.includes(p.name);
  const championImage=isMale?"./sd-champion-male.svg?v=20261104-athlete2":"./sd-champion-female.svg?v=20261104-athlete2";
  const value=w.metric==="ciro"?sdFmt(p[w.metric],0)+" TL":sdFmt(p[w.metric],2);
  el.classList.add("sd-award-card-premium","sd-award-card-"+w.metric);
  el.setAttribute("aria-label",w.label+" — "+p.name+" — "+value);
  const crown=isMale?'<span class="sd-champion-crown sd-champion-crown-king" aria-label="Kral tacı" role="img"><svg viewBox="0 0 64 48" aria-hidden="true"><path d="M5 13 17 25 25 7 32 24 40 7 48 25 59 13 54 40H10Z" fill="currentColor" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M10 34H54" stroke="#fff" stroke-width="2"/><circle cx="17" cy="26" r="2.5" fill="#fff"/><circle cx="32" cy="25" r="2.5" fill="#fff"/><circle cx="48" cy="26" r="2.5" fill="#fff"/></svg></span>':'<span class="sd-champion-crown sd-champion-crown-queen" aria-label="Kraliçe tacı" role="img"><svg viewBox="0 0 64 48" aria-hidden="true"><path d="M5 15 15 23 21 5 32 21 43 5 49 23 59 15 54 40H10Z" fill="currentColor" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M10 34H54" stroke="#fff" stroke-width="2"/><circle cx="15" cy="23" r="2.5" fill="#fff"/><circle cx="21" cy="7" r="2.5" fill="#fff"/><circle cx="32" cy="22" r="2.5" fill="#fff"/><circle cx="43" cy="7" r="2.5" fill="#fff"/><circle cx="49" cy="23" r="2.5" fill="#fff"/></svg></span>';
  el.innerHTML='<div class="sd-award-winner"><div class="sd-award-trophy" aria-hidden="true"></div><div class="sd-award-winner-copy"><div class="sd-champion-title-wrap">'+crown+'<small>'+w.label+'</small></div><strong>'+p.name+'</strong><b><span>GERÇEKLEŞEN '+w.unit+':</span> '+value+'</b></div></div>';
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
  if(status)status.textContent="✓ Kasım 2026 SD Karne verileri güncel olarak yüklendi.";
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
  const fileUrl=SD_KARNE_URL+"?v=20261105";
  viewer.src="https://view.officeapps.live.com/op/embed.aspx?src="+encodeURIComponent(fileUrl);
 }
}
