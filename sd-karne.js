const SD_KARNE_URL="https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/SD%20Karne.xlsx";
const SD_STAFF=["Sinem Palaz","Serkan Canik","Cem Aktaş","Merve Çetin","Ecenur Temür"];
let sdKarneRows=[];
let sdKarneBook=null;
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
 const headerRow=11,headers=rows[headerRow]||[];
 const find=(tests,exclude=[])=>{const i=headers.findIndex(v=>{const n=sdNorm(v);return tests.some(t=>n.includes(t))&&!exclude.some(t=>n.includes(t));});return i;};
 const exact=(name)=>headers.findIndex(v=>sdNorm(v)===sdNorm(name));
 const map={
  upt:exact("UPT"),ciro:exact("GERÇEKLEŞEN CİRO"),bonus:exact("AYSONU KAZANÇ"),cr:exact("KİŞİSEL CR"),
  invoices:find(["fatura adedi","fatura sayisi","fis adedi","fis sayisi","invoice"]),
  products:find(["urun adedi","urun sayisi","satilan urun","product quantity","adet toplam"]),
  atv:find(["atv","ortalama fis tutari","ortalama fatura tutari"]),
  asp:find(["asp","ortalama urun fiyati"]),
  closingRevenue:find(["ay sonu kapanis ciro","aysonu kapanis ciro","ay sonu ciro","aysonu ciro","tahmini kapanis ciro","tahmini ay sonu ciro","kapanis ciro","ay sonu satis","projected sales","forecast sales"]),
  hgo:find(["hgo","hedef gerceklesme orani","hedef gerceklesme %"],["kapanis","ay sonu","aysonu"]),
  closingHgo:find(["ay sonu kapanis hgo","aysonu kapanis hgo","kapanis hgo","ay sonu hgo","aysonu hgo","month end hgo","closing hgo"]),
  ciroTarget:find(["ciro hedefi","hedef ciro","sales target"])
 };
 const required=["upt","ciro","bonus","cr"],missing=required.filter(k=>map[k]<0);
 if(missing.length)throw new Error("SD KARNE tablosunda gerekli başlıklar bulunamadı: "+missing.join(", "));
 return {rows,headerRow,map,sheetName};
}
function sdReadData(book){
 const table=sdFindTable(book),out=[];
 for(const name of SD_STAFF){
  const key=sdNorm(name),row=table.rows.find((r,i)=>i>table.headerRow&&r.some(v=>sdNorm(v)===key));
  if(!row)throw new Error(name+" için personel satırı bulunamadı.");
  const val=k=>table.map[k]>=0?sdNum(row[table.map[k]]):0;
  let cr=val("cr");if(cr>0&&cr<=1)cr*=100;
  const ciro=val("ciro"),invoices=val("invoices"),products=val("products");
  const atv=table.map.atv>=0?val("atv"):(invoices>0?ciro/invoices:0);
  const asp=table.map.asp>=0?val("asp"):(products>0?ciro/products:0);
  const closingRevenue=table.map.closingRevenue>=0?val("closingRevenue"):0;
  const closingHgo=table.map.closingHgo>=0?val("closingHgo"):0;
  const closingHgoLabel=table.map.closingHgo>=0?String((table.rows[table.headerRow]||[])[table.map.closingHgo]).trim():"AY SONU KAPANIŞ HGO";
  let hgo=table.map.hgo>=0?val("hgo"):(table.map.ciroTarget>=0&&val("ciroTarget")>0?(closingRevenue||ciro)/val("ciroTarget")*100:0);
  if(hgo>0&&hgo<=1)hgo*=100;
  out.push({name,ciro,upt:val("upt"),cr,bonus:val("bonus"),invoices,products,atv,asp,closingRevenue,closingHgo,closingHgoLabel,hgo,hasInvoices:table.map.invoices>=0,hasProducts:table.map.products>=0});
 }
 return out;
}
function sdFmt(v,d=2){return new Intl.NumberFormat("tr-TR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(Number(v)||0);}
function sdWinner(items,key){return items.reduce((a,b)=>b[key]>a[key]?b:a,items[0]);}
function renderSDKarne(){
 if(!sdKarneRows.length)return;
 const winners=[
  {id:"sdUptWinner",label:"⚡ UPT ŞAMPİYONU",metric:"upt",unit:"UPT",icon:"⚡"},
  {id:"sdCrWinner",label:"🎯 CR ŞAMPİYONU",metric:"cr",unit:"CR",icon:"🎯"},
  {id:"sdCiroWinner",label:"💰 CİRO ŞAMPİYONU",metric:"ciro",unit:"CİRO",icon:"💰"}
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
  const crown=isMale
   ?'<span class="sd-champion-crown sd-champion-crown-king" aria-label="Kral tacı" role="img"><svg viewBox="0 0 120 82" aria-hidden="true"><defs><linearGradient id="championGold" x1="0" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".22" stop-color="#f7d56b"/><stop offset=".52" stop-color="#bd8424"/><stop offset=".76" stop-color="#f6d77b"/><stop offset="1" stop-color="#8e5b13"/></linearGradient><linearGradient id="championGoldEdge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff8d9"/><stop offset="1" stop-color="#a66d18"/></linearGradient></defs><path d="M13 23 34 39 46 10 60 35 75 10 87 39 108 23 99 68H21Z" fill="url(#championGold)" stroke="url(#championGoldEdge)" stroke-width="3" stroke-linejoin="round"/><path d="M21 58H99L96 69H24Z" fill="#9d691c" opacity=".75"/><path d="M18 72H102" stroke="#f8e4a0" stroke-width="3" stroke-linecap="round"/><path d="M34 39 60 35 87 39" fill="none" stroke="#fff0b4" stroke-width="2" opacity=".8"/><circle cx="13" cy="21" r="5" fill="#fff0b4"/><circle cx="46" cy="9" r="5" fill="#fff0b4"/><circle cx="75" cy="9" r="5" fill="#fff0b4"/><circle cx="108" cy="21" r="5" fill="#fff0b4"/><path d="m60 43 7 8-7 8-7-8Z" fill="#f7fbff" stroke="#a77a28" stroke-width="1.5"/></svg></span>'
   :'<span class="sd-champion-crown sd-champion-crown-queen" aria-label="Kraliçe tacı" role="img"><svg viewBox="0 0 120 82" aria-hidden="true"><defs><linearGradient id="championGold" x1="0" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".22" stop-color="#f7d56b"/><stop offset=".52" stop-color="#bd8424"/><stop offset=".76" stop-color="#f6d77b"/><stop offset="1" stop-color="#8e5b13"/></linearGradient><linearGradient id="championGoldEdge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff8d9"/><stop offset="1" stop-color="#a66d18"/></linearGradient></defs><path d="M13 27 31 39 39 11 60 34 81 11 89 39 108 27 99 68H21Z" fill="url(#championGold)" stroke="url(#championGoldEdge)" stroke-width="3" stroke-linejoin="round"/><path d="M21 58H99L96 69H24Z" fill="#9d691c" opacity=".75"/><path d="M18 72H102" stroke="#f8e4a0" stroke-width="3" stroke-linecap="round"/><path d="M31 39 60 34 89 39" fill="none" stroke="#fff0b4" stroke-width="2" opacity=".8"/><circle cx="13" cy="25" r="5" fill="#fff0b4"/><circle cx="39" cy="10" r="5" fill="#fff0b4"/><circle cx="60" cy="33" r="5" fill="#fff0b4"/><circle cx="81" cy="10" r="5" fill="#fff0b4"/><circle cx="108" cy="25" r="5" fill="#fff0b4"/><path d="m60 43 7 8-7 8-7-8Z" fill="#f7fbff" stroke="#a77a28" stroke-width="1.5"/></svg></span>'
  el.innerHTML='<div class="sd-award-winner"><div class="sd-award-trophy" aria-hidden="true"></div><div class="sd-award-winner-copy"><div class="sd-champion-title-wrap">'+crown+'<small>'+w.label+'</small></div><strong>'+p.name+'</strong><b><span>GERÇEKLEŞEN '+w.unit+':</span> '+value+'</b></div></div>';
 });
 const cards=document.getElementById("sdStaffCards");
 if(cards)cards.innerHTML=sdKarneRows.map(p=>'<article class="sd-staff-card"><div class="sd-staff-top"><h3>👤 '+p.name+'</h3><span class="sd-bonus-chip">🎁 AY SONU KAZANÇ <strong>'+sdFmt(p.bonus,0)+' TL</strong></span></div><div class="sd-staff-metrics sd-staff-metrics-expanded">'+
 '<div><span>CİRO</span><strong>'+sdFmt(p.ciro,0)+' TL</strong></div>'+
 '<div><span>FATURA ADEDİ</span><strong>'+(p.hasInvoices?sdFmt(p.invoices,0):'—')+'</strong></div>'+
 '<div><span>ÜRÜN ADEDİ</span><strong>'+(p.hasProducts?sdFmt(p.products,0):'—')+'</strong></div>'+
 '<div><span>ATV</span><strong>'+sdFmt(p.atv,0)+' TL</strong></div>'+
 '<div><span>ASP</span><strong>'+sdFmt(p.asp,0)+' TL</strong></div>'+
 '<div><span>UPT</span><strong>'+sdFmt(p.upt,2)+'</strong></div>'+
 '<div><span>CR</span><strong>'+sdFmt(p.cr,2)+'%</strong></div>'+
 '<div><span>AY SONU KAPANIŞ CİRO</span><strong>'+(p.closingRevenue?sdFmt(p.closingRevenue,0)+' TL':'—')+'</strong></div>'+
 '<div><span>HGO</span><strong>'+(p.hgo?sdFmt(p.hgo,1)+'%':'—')+'</strong></div>'+
 '<div><span>'+p.closingHgoLabel+'</span><strong>'+(p.closingHgo?sdFmt(p.closingHgo,1)+'%':'—')+'</strong></div>'+ 
 '</div></article>').join("");
}
async function loadSDKarneData(){
 const status=document.getElementById("sdKarneStatus");
 try{
  if(!window.XLSX)throw new Error("Excel okuma kütüphanesi yüklenemedi.");
  if(status)status.textContent="SD Karne verileri yükleniyor…";
  const response=await fetch(SD_KARNE_URL+"?v="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw new Error("GitHub Excel dosyasına erişilemedi ("+response.status+").");
  const book=XLSX.read(await response.arrayBuffer(),{type:"array",cellDates:false});
  sdKarneBook=book;
  sdKarneRows=sdReadData(book);
  window.BUYAKA_SD_KARNE_ROWS=sdKarneRows;
  renderSDKarne();
  if(status)status.textContent="✓ Kasım 2026 SD Karne verileri güncel olarak yüklendi.";
  return sdKarneRows;
 }catch(error){
  console.error("SD Karne yükleme hatası:",error);
  if(status)status.textContent="Veriler yüklenemedi: "+error.message;
  const cards=document.getElementById("sdStaffCards");
  if(cards)cards.innerHTML='<div class="league-empty">'+error.message+'</div>';
  window.BUYAKA_SD_KARNE_ROWS=[];
  return [];
 }
}
function toggleSDKarneExcel(){
 const wrap=document.getElementById("sdKarneViewerWrap");
 const tableHost=document.getElementById("sdKarneOriginalTable");
 const button=document.getElementById("sdKarneOriginalButton");
 if(!wrap||!tableHost)return;
 const opening=wrap.hidden;
 wrap.hidden=!opening;
 if(button)button.textContent=opening?"ORİJİNAL TABLOYU GİZLE":"ORİJİNAL TABLOYU GÖSTER";
 if(opening){
  if(!sdKarneBook){tableHost.innerHTML='<p class="sd-original-loading">Önce SD Karne Excel verisinin yüklenmesini bekleyin.</p>';return;}
  const sheetName=sdKarneBook.SheetNames.find(n=>sdNorm(n)==="sd karne")||sdKarneBook.SheetNames[0];
  const sheet=sdKarneBook.Sheets[sheetName];
  tableHost.innerHTML=XLSX.utils.sheet_to_html(sheet,{id:"sdOriginalWorkbookTable",editable:false});
 }
}


// Personel Yönetim Merkezi içindeki SD Karne sekmesinde gerçek Excel dosyasını gömülü aç.
async function togglePMXSDKarneExcel(){
 const wrap=document.getElementById("pmxSdOriginalWrap");
 const host=document.getElementById("pmxSdOriginalTable");
 const button=document.getElementById("pmxSdOriginalButton");
 if(!wrap||!host)return;
 const opening=wrap.hidden;
 wrap.hidden=!opening;
 if(button)button.textContent=opening?"📂 ORİJİNAL TABLOYU GİZLE":"📂 ORİJİNAL TABLOYU AÇ";
 if(!opening)return;
 const officeViewer="https://view.officeapps.live.com/op/embed.aspx?src="+encodeURIComponent(SD_KARNE_URL);
 host.innerHTML='<div style="width:100%;min-width:0"><div style="margin:0 0 10px;padding:10px 12px;background:#f5f5f5;border:1px solid #ddd;border-radius:8px;color:#222;font-size:13px">GitHub’daki orijinal SD Karne Excel dosyası açılıyor. Excel’in sayfa düzeni ve biçimlendirmesi korunur.</div><iframe title="Orijinal SD Karne Excel çalışma kitabı" src="'+officeViewer+'" style="display:block;width:100%;height: min(78vh, 900px);min-height:560px;border:1px solid #d8d8d8;border-radius:8px;background:#fff" loading="lazy" allowfullscreen></iframe><p style="margin:10px 0 0;font-size:12px"><a href="'+SD_KARNE_URL+'" target="_blank" rel="noopener noreferrer" style="color:#d5001c;font-weight:700">Excel dosyasını doğrudan aç / indir ↗</a></p></div>';
}
window.togglePMXSDKarneExcel=togglePMXSDKarneExcel;
