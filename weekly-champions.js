/* BUYAKA PUMA — HAFTANIN ENLERİ */
(function(){
  const winners={
    textile:{code:"52590801",name:"M TAD ESS SOLID CAT TEE LC",units:6,bu:"Run/Train",amount:7554,group:"TEKSTİL"},
    footwear:{code:"40236603",name:"CA Pro Classic II",units:6,bu:"Sportstyle Prime",amount:30610,group:"AYAKKABI"}
  };
  let active="revenue",products=[],loaded=false;
  const money=n=>new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}).format(n)+" ₺";
  const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  function setTabState(){document.querySelectorAll(".wc-tab").forEach(b=>b.classList.toggle("active",b.dataset.wcTab===active));}
  function personPanel(kind){
    const title=kind==="revenue"?"HAFTANIN CİRO ŞAMPİYONU":"HAFTANIN UPT ŞAMPİYONU";
    const metric=kind==="revenue"?"EN YÜKSEK HAFTALIK CİRO":"EN YÜKSEK HAFTALIK UPT";
    return '<section class="wc-winner-panel"><div class="wc-panel-heading"><small>PERSONEL PERFORMANSI</small><h2>'+title+'</h2></div><div class="wc-person-placeholder"><div class="wc-trophy-mark">🏆</div><div><strong>Personel verisi bekleniyor</strong><p>'+metric+' için haftalık personel bazlı ciro / fatura / ürün adedi kaynağı henüz uygulamaya bağlanmadı. Gerçek şampiyonu göstermek için bu veriyi kullanacağım; isim veya skor uydurulmayacak.</p></div></div></section>';
  }
  function productPanel(kind){
    const r=winners[kind],item=products.find(x=>String(x.productCode||x.code||"").trim()===r.code);
    const image=item&&item.image?'<img src="'+esc(item.image)+'" alt="'+esc(r.name)+'" loading="lazy">':'<div class="wc-product-no-image">PUMA</div>';
    return '<section class="wc-winner-panel"><div class="wc-panel-heading"><small>W44 · TOP 20</small><h2>HAFTANIN EN ÇOK SATAN '+r.group+' ÜRÜNÜ</h2></div><article class="wc-product-card">'+image+'<div class="wc-product-copy"><span class="wc-product-rank">#1 · '+r.group+'</span><h3>'+esc(r.name)+'</h3><p>Ürün kodu: '+r.code+'</p><div class="wc-product-stats"><div><small>SATILAN ADET</small><strong>'+r.units+'</strong></div><div><small>TOPLAM CİRO</small><strong>'+money(r.amount)+'</strong></div><div><small>BUSINESS UNIT</small><strong>'+esc(r.bu)+'</strong></div></div></div></article></section>';
  }
  function render(){
    const root=document.getElementById("weeklyChampionsContent");if(!root)return;
    root.innerHTML=(active==="revenue"||active==="upt")?personPanel(active):productPanel(active);
    setTabState();
  }
  window.setWeeklyChampionsTab=function(tab){if(!["revenue","upt","textile","footwear"].includes(tab))return;active=tab;render();};
  window.showWeeklyChampions=function(){
    ["mainMenu","productSearchArea","sizeSearchArea","educationArea","shiftProgramArea","sdKarneArea","performanceLeagueArea","top5AnalysisArea","fastPerakendeArea","storeStatusArea","storeManagementArea"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="none";});
    const area=document.getElementById("weeklyChampionsArea");if(area)area.style.display="block";
    window.scrollTo({top:0,behavior:"smooth"});
    if(!loaded){fetch("./data.json?v="+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.json():[]).then(d=>{products=Array.isArray(d)?d:[];loaded=true;render();}).catch(()=>{loaded=true;render();});}
    render();
  };
  window.closeWeeklyChampions=function(){const a=document.getElementById("weeklyChampionsArea");if(a)a.style.display="none";if(typeof window.showMainMenu==="function")window.showMainMenu();};
})();
