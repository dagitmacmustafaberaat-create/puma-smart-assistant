/* BUYAKA PUMA — HAFTANIN ENLERİ */
(function(){
 let active="revenue";
 const money=n=>new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}).format(Number(n)||0)+" ₺";
 const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 function panel(kind){
  const titles={revenue:"CİRO ŞAMPİYONU",upt:"UPT ŞAMPİYONU",atv:"ATV ŞAMPİYONU",cr:"CR ŞAMPİYONU"};
  const rows=Array.isArray(window.BUYAKA_SD_KARNE_ROWS)?window.BUYAKA_SD_KARNE_ROWS:[];
  const league=window.BUYAKA_LEAGUE_DATA?.staff||[];
  if(!rows.length)return '<section class="wc-winner-panel"><div class="wc-panel-heading"><small>SD KARNE</small><h2>'+titles[kind]+'</h2></div><div class="wc-person-placeholder"><strong>SD Karne verisi yüklenemedi</strong></div></section>';
  let list=rows.map(p=>{const sale=league.find(x=>x.name===p.name),invoices=Number(sale?.invoices)||0;return {...p,atv:invoices?Number(p.ciro||0)/invoices:0,invoices};});
  if(kind==="atv")list=list.filter(p=>p.invoices>0);
  if(!list.length)return '<section class="wc-winner-panel"><h2>ATV ŞAMPİYONU</h2><p>Fatura verisi bulunamadı.</p></section>';
  const metric=kind==="atv"?"atv":kind==="revenue"?"ciro":kind==="upt"?"upt":"cr";
  const winner=list.reduce((a,b)=>Number(b[metric])>Number(a[metric])?b:a,list[0]);
  const male=["Cem Aktaş","Serkan Canik"].includes(winner.name);
  const value=kind==="revenue"?money(winner.ciro):kind==="atv"?money(winner.atv):new Intl.NumberFormat("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(winner[metric])||0);
  const suffix=kind==="upt"?" UPT":kind==="cr"?"%":"";
  return '<section class="wc-winner-panel"><div class="wc-panel-heading"><small>'+(kind==="atv"?"PERFORMANCE LEAGUE · CİRO / FATURA":"SD KARNE · PERSONEL PERFORMANSI")+'</small><h2>HAFTANIN '+titles[kind]+'</h2></div><article class="wc-person-champion"><div class="wc-person-mascot '+(male?"male":"female")+'"><img src="'+(male?"./Zafer%20Kupas%C4%B1%20Puma%20Maskotu.png":"./Zafer%20Kupas%C4%B1n%C4%B1%20Kald%C4%B1ran%20Puma%20Mascotu.png")+'" alt="Puma kupa şampiyonu" loading="eager"></div><div class="wc-person-copy"><h3>'+esc(winner.name)+'</h3><strong class="wc-person-result">'+value+suffix+'</strong></div></article></section>';
 }
 function render(){const root=document.getElementById("weeklyChampionsContent");if(root){root.innerHTML=panel(active);document.querySelectorAll(".wc-tab").forEach(b=>b.classList.toggle("active",b.dataset.wcTab===active));}}
 window.setWeeklyChampionsTab=function(tab){if(["revenue","upt","atv","cr"].includes(tab)){active=tab;render();}};
 window.showWeeklyChampions=function(){
  ["mainMenu","productSearchArea","sizeSearchArea","educationArea","shiftProgramArea","sdKarneArea","performanceLeagueArea","top5AnalysisArea","fastPerakendeArea","storeStatusArea","storeManagementArea"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="none";});
  const area=document.getElementById("weeklyChampionsArea");if(area)area.style.display="block";window.scrollTo({top:0,behavior:"smooth"});
  const jobs=[];if(typeof window.loadSDKarneData==="function")jobs.push(window.loadSDKarneData());if(typeof window.loadLeagueData==="function")jobs.push(window.loadLeagueData());
  Promise.all(jobs).then(render).catch(render);render();
 };
 window.closeWeeklyChampions=function(){const a=document.getElementById("weeklyChampionsArea");if(a)a.style.display="none";if(typeof window.showMainMenu==="function")window.showMainMenu();};
})();