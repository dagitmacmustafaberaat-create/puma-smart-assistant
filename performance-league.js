const LEAGUE_STAFF=[
  {id:"sinem",name:"Sinem Palaz",role:"SUPERVISOR"},
  {id:"serkan",name:"Serkan Canik",role:"SALES ADVISOR"},
  {id:"cem",name:"Cem Aktaş",role:"SALES ADVISOR"},
  {id:"merve",name:"Merve Çetin",role:"SALES ADVISOR"},
  {id:"ecenur",name:"Ecenur Temür",role:"SALES ADVISOR"}
];
const LEAGUE_WORKBOOK_URL="https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/KASIM%20PERSONEL%20FATURA%20VE%20%C3%9CR%C3%9CN%20ADED%C4%B0%20HEDEF.xlsx";
let leagueData={month:"2026-11",staff:[],source:""};
function leagueNumber(v,d=0){return new Intl.NumberFormat("tr-TR",{maximumFractionDigits:d,minimumFractionDigits:d}).format(Number(v)||0);}
function leagueEsc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function leagueNameKey(v){return String(v||"").toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/İ/g,"i").replace(/ç/g,"c").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/\s+/g," ").trim();}
function leagueMonthFromTitle(v){const m=String(v||"").toLocaleUpperCase("tr-TR").match(/(OCAK|ŞUBAT|MART|NİSAN|MAYIS|HAZİRAN|TEMMUZ|AĞUSTOS|EYLÜL|EKİM|KASIM|ARALIK)\s+(20\d{2})/);if(!m)return"2026-11";const months={"OCAK":"01","ŞUBAT":"02","MART":"03","NİSAN":"04","MAYIS":"05","HAZİRAN":"06","TEMMUZ":"07","AĞUSTOS":"08","EYLÜL":"09","EKİM":"10","KASIM":"11","ARALIK":"12"};return m[2]+"-"+months[m[1]];}
function leagueMonthLabel(v){const p=v.split("-");const names=["","OCAK","ŞUBAT","MART","NİSAN","MAYIS","HAZİRAN","TEMMUZ","AĞUSTOS","EYLÜL","EKİM","KASIM","ARALIK"];return names[Number(p[1])]+" "+p[0];}
function leagueMonthBounds(v){const p=v.split("-").map(Number),last=new Date(p[0],p[1],0).getDate();return{days:last};}
async function loadLeagueData(){
 const status=document.getElementById("leagueDataStatus");
 try{
  if(!window.XLSX)throw new Error("Excel okuma kütüphanesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
  const response=await fetch(LEAGUE_WORKBOOK_URL+"?v="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw new Error("GitHub'daki Kasım hedef Excel dosyasına erişilemedi ("+response.status+").");
  const bytes=await response.arrayBuffer(),book=XLSX.read(bytes,{type:"array",cellDates:false});
  const sheet=book.Sheets["Sayfa1"]||book.Sheets[book.SheetNames[0]];
  if(!sheet)throw new Error("Excel içinde okunabilir sayfa bulunamadı.");
  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null,raw:true});
  const month=leagueMonthFromTitle(rows?.[0]?.[0]);
  const staff=LEAGUE_STAFF.map(person=>{
   const targetRow=rows.slice(3,8).find(r=>leagueNameKey(r?.[0])===leagueNameKey(person.name));
   const actualRow=rows.slice(3,9).find(r=>leagueNameKey(r?.[6])===leagueNameKey(person.name));
   const dailyRow=rows.slice(12,17).find(r=>leagueNameKey(r?.[0])===leagueNameKey(person.name));
   if(!targetRow||!actualRow||!dailyRow)throw new Error(person.name+" için Excel satırı bulunamadı.");
   return {...person,invoiceTarget:Number(targetRow[2])||0,unitTarget:Number(targetRow[3])||0,invoices:Number(actualRow[8])||0,units:Number(actualRow[9])||0,dailyInvoice:Number(dailyRow[1])||0,dailyUnits:Number(dailyRow[2])||0};
  });
  if(staff.some(s=>!s.invoiceTarget||!s.unitTarget))throw new Error("Excel hedef değerleri boş veya hatalı.");
  leagueData={month,staff,source:"GitHub Excel"};
  if(status)status.textContent="✓ GitHub Excel dosyasından güncel veriler yüklendi · "+new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"});
 }catch(error){
  if(status)status.textContent="Excel verisi yüklenemedi: "+error.message;
  console.error("Performance League Excel load error:",error);
  const board=document.getElementById("leagueLeaderboard");
  if(board)board.innerHTML='<tr><td colspan="10" class="league-empty">Excel verileri okunamadı. GitHub dosya adını ve erişimini kontrol edin.</td></tr>';
  return;
 }
 renderPerformanceLeague();
}
function showPerformanceLeague(){
 ["mainMenu","productSearchArea","sizeSearchArea","educationArea","dailyTasksArea","vmStandardsArea","shiftProgramArea","sdKarneArea","fastPerakendeArea"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="none";});
 const area=document.getElementById("performanceLeagueArea");if(area)area.style.display="block";
 loadLeagueData();window.scrollTo(0,0);
}
function closePerformanceLeague(){const area=document.getElementById("performanceLeagueArea");if(area)area.style.display="none";showMainMenu();}
function renderPerformanceLeague(){
 if(!leagueData.staff?.length)return;
 const month=leagueData.month,bounds=leagueMonthBounds(month),now=new Date(),todayMonth=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
 const elapsed=month===todayMonth?now.getDate():(month<todayMonth?bounds.days:1);
 const put=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
 put("leagueMonthLabel",leagueMonthLabel(month));
 const invoiceTarget=leagueData.staff.reduce((n,s)=>n+s.invoiceTarget,0),unitTarget=leagueData.staff.reduce((n,s)=>n+s.unitTarget,0);
 const invoices=leagueData.staff.reduce((n,s)=>n+s.invoices,0),units=leagueData.staff.reduce((n,s)=>n+s.units,0);
 put("leagueTargetInvoices",leagueNumber(invoiceTarget));put("leagueTargetUnits",leagueNumber(unitTarget));
 put("leagueInvoices",leagueNumber(invoices)+" / "+leagueNumber(invoiceTarget));put("leagueUnits",leagueNumber(units)+" / "+leagueNumber(unitTarget));
 put("leagueInvoiceRate","%"+leagueNumber(invoiceTarget?invoices/invoiceTarget*100:0,1)+" aylık hedef");
 put("leagueUnitRate","%"+leagueNumber(unitTarget?units/unitTarget*100:0,1)+" aylık hedef");
 const ranked=leagueData.staff.map(s=>{
  const ip=s.invoiceTarget?s.invoices/s.invoiceTarget*100:0,up=s.unitTarget?s.units/s.unitTarget*100:0,score=(ip+up)/2;
  const invoicePace=s.dailyInvoice*elapsed,unitPace=s.dailyUnits*elapsed;
  return {...s,score,invoiceTrack:invoicePace?s.invoices/invoicePace*100:0,unitTrack:unitPace?s.units/unitPace*100:0,invoicePace,unitPace};
 }).sort((a,b)=>b.score-a.score);
 const leader=ranked[0],best=document.getElementById("leagueBestCard");
 if(leader){put("leagueBestName",leader.name);put("leagueBestDetail","Aylık hedefinin %"+leagueNumber(leader.score,1)+" seviyesinde · "+leagueNumber(leader.invoices)+" fatura · "+leagueNumber(leader.units)+" ürün");put("leagueBestScore","%"+leagueNumber(leader.score,1));if(best)best.classList.toggle("league-best-empty",leader.score===0);}
 const board=document.getElementById("leagueLeaderboard");
 if(board)board.innerHTML=ranked.map((r,i)=>'<tr class="'+(i===0?"league-table-first":"")+'"><td><strong>'+(i===0?"🏆 ":"")+leagueEsc(r.name)+'</strong><small>'+r.role+'</small></td><td>'+leagueNumber(r.invoiceTarget)+'</td><td>'+leagueNumber(r.dailyInvoice,1)+'</td><td>'+leagueNumber(r.invoices)+'</td><td><div class="league-pace-cell"><strong>%'+leagueNumber(r.invoiceTrack,0)+'</strong><small>Beklenen '+leagueNumber(r.invoicePace,1)+'</small></div></td><td>'+leagueNumber(r.unitTarget)+'</td><td>'+leagueNumber(r.dailyUnits,1)+'</td><td>'+leagueNumber(r.units)+'</td><td><div class="league-pace-cell"><strong>%'+leagueNumber(r.unitTrack,0)+'</strong><small>Beklenen '+leagueNumber(r.unitPace,1)+'</small></div></td><td><strong class="league-score-value">%'+leagueNumber(r.score,1)+'</strong></td></tr>').join("");
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&document.getElementById("performanceLeagueArea")?.style.display!=="none")loadLeagueData();});
setInterval(()=>{const area=document.getElementById("performanceLeagueArea");if(area&&area.style.display!=="none"&&document.visibilityState==="visible")loadLeagueData();},5*60*1000);
