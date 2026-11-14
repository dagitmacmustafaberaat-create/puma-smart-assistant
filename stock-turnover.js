/* BUYAKA PUMA • GITHUB-DRIVEN STOCK TURNOVER TABLE */
(function(){
  "use strict";
  const EXCEL_URL="https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/Stok%20Devir%20Tablo.xlsx";
  const CATEGORY_ORDER=["TEKSTİL","AYAKKABI","AKSESUAR"];
  let categoryTables={},activeCategory="",loaded=false,loading=false;

  const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleUpperCase("tr-TR").replace(/İ/g,"I").replace(/ı/g,"I").replace(/[^A-Z0-9]+/g," ").trim();
  const escapeHtml=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  function categoryFrom(value){
    const text=normalize(value);
    if(/TEKSTIL|TEXTILE|APPAREL|CLOTHING/.test(text))return "TEKSTİL";
    if(/AYAKKABI|FOOTWEAR|SHOES/.test(text))return "AYAKKABI";
    if(/AKSESUAR|ACCESSOR/.test(text))return "AKSESUAR";
    return "";
  }
  function findHeader(rows){
    let fallback=-1;
    for(let i=0;i<Math.min(rows.length,25);i++){
      const cells=(rows[i]||[]).map(normalize);
      const filled=cells.filter(Boolean).length;
      const hasProduct=cells.some(v=>/STOK KODU|URUN KODU|PRODUCT CODE|STOCK CODE/.test(v));
      const hasStock=cells.some(v=>/STOK|STOCK/.test(v));
      const hasSales=cells.some(v=>/SATIS|SALES/.test(v));
      const hasTurnover=cells.some(v=>/DEVIR|TURNOVER/.test(v));
      if(hasProduct&&hasStock&&(hasSales||hasTurnover))return i;
      if(hasProduct&&filled>=3&&fallback<0)fallback=i;
    }
    return fallback;
  }
  function findCategoryColumn(headers){
    return headers.findIndex(v=>/KATEGORI|CATEGORY|URUN GRUBU|PRODUCT GROUP/.test(normalize(v)));
  }
  function sheetTable(sheet){
    const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:"",raw:false});
    const headerIndex=findHeader(rows);
    if(headerIndex<0)return null;
    const headers=(rows[headerIndex]||[]).map(v=>String(v??"").trim());
    let last=headers.length;
    while(last>0&&!headers[last-1])last--;
    const cleanHeaders=headers.slice(0,last);
    const data=rows.slice(headerIndex+1).filter(row=>row.slice(0,last).some(v=>String(v??"").trim()!==""));
    return {headers:cleanHeaders,rows:data.map(row=>row.slice(0,last)),categoryColumn:findCategoryColumn(cleanHeaders),title:String((rows.slice(0,headerIndex).flat().find(v=>String(v??"").trim())||"")).trim()};
  }
  function status(message){const el=document.getElementById("stoDataStatus");if(el)el.textContent=message;}
  function renderTabs(){
    const root=document.getElementById("stoCategoryTabs");if(!root)return;
    const categories=CATEGORY_ORDER.filter(c=>categoryTables[c]);
    root.innerHTML=categories.map(c=>'<button type="button" class="sto-category-tab'+(c===activeCategory?' active':'')+'" data-sto-category="'+c+'" role="tab" aria-selected="'+(c===activeCategory?'true':'false')+'">'+c+'</button>').join("");
    root.querySelectorAll("[data-sto-category]").forEach(button=>button.addEventListener("click",()=>setStockTurnoverCategory(button.dataset.stoCategory)));
  }
  function renderTable(){
    const table=categoryTables[activeCategory],wrap=document.getElementById("stoTableWrap"),summary=document.getElementById("stoTableSummary");
    if(!wrap||!table)return;
    if(summary)summary.textContent=activeCategory+" • "+table.rows.length.toLocaleString("tr-TR")+" ürün satırı"+(table.title?" • "+table.title:"");
    const head="<thead><tr>"+table.headers.map(h=>"<th>"+escapeHtml(h)+"</th>").join("")+"</tr></thead>";
    const body="<tbody>"+table.rows.map(row=>"<tr>"+table.headers.map((_,i)=>"<td>"+escapeHtml(row[i]??"")+"</td>").join("")+"</tr>").join("")+"</tbody>";
    wrap.innerHTML='<table class="sto-table">'+head+body+"</table>";
    renderTabs();
  }
  window.setStockTurnoverCategory=function(category){
    if(!categoryTables[category])return;
    activeCategory=category;renderTable();
  };
  window.loadStockTurnover=async function(force){
    if(loading)return;
    if(loaded&&!force){renderTabs();renderTable();return;}
    loading=true;status("GitHub üzerindeki Stok Devir Tablo.xlsx okunuyor…");
    const wrap=document.getElementById("stoTableWrap");if(wrap)wrap.innerHTML='<div class="sto-empty">Excel dosyası yükleniyor…</div>';
    try{
      if(!window.XLSX)throw new Error("Excel okuma bileşeni yüklenemedi. Sayfayı yenileyin.");
      const response=await fetch(EXCEL_URL+"?v="+Date.now(),{cache:"no-store"});
      if(!response.ok)throw new Error("GitHub Excel dosyasına erişilemedi ("+response.status+").");
      const buffer=await response.arrayBuffer();
      const workbook=XLSX.read(buffer,{type:"array",cellDates:true});
      const next={};
      workbook.SheetNames.forEach(sheetName=>{
        const table=sheetTable(workbook.Sheets[sheetName]);if(!table)return;
        const sheetCategory=categoryFrom(sheetName);
        if(sheetCategory){next[sheetCategory]=table;return;}
        if(table.categoryColumn>=0){
          table.rows.forEach(row=>{
            const category=categoryFrom(row[table.categoryColumn]);if(!category)return;
            if(!next[category])next[category]={headers:table.headers,rows:[],title:table.title};
            next[category].rows.push(row);
          });
        }
      });
      if(!Object.keys(next).length)throw new Error("Excel içinde TEKSTİL, AYAKKABI veya AKSESUAR sayfaları ya da kategori sütunu bulunamadı.");
      categoryTables=next;
      activeCategory=CATEGORY_ORDER.find(c=>categoryTables[c])||Object.keys(categoryTables)[0];
      loaded=true;renderTabs();renderTable();
      status("✓ GitHub Excel dosyası güncel olarak yüklendi • "+new Date().toLocaleString("tr-TR"));
    }catch(error){
      console.error("BUYAKA STOCK TURNOVER:",error);
      status("Veri yüklenemedi: "+error.message);
      if(wrap)wrap.innerHTML='<div class="sto-empty">'+escapeHtml(error.message)+'</div>';
    }finally{loading=false;}
  };
  window.showStockTurnover=function(){
    const hideIds=["mainMenu","productSearchArea","sizeSearchArea","educationArea","shiftProgramArea","sdKarneArea","performanceLeagueArea","fastPerakendeArea","top5AnalysisArea","storeStatusArea","personnelManagementArea","storeManagementArea","servicePlanArea","stockTurnoverArea"];
    hideIds.forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=id==="stockTurnoverArea"?"block":"none";});
    window.scrollTo({top:0,behavior:"smooth"});
    window.loadStockTurnover(true);
  };
  // Modül açıkken GitHub Excel dosyasını dakikada bir kontrol et; yeni commitler ekrana otomatik yansısın.
  window.setInterval(function(){
    const area=document.getElementById("stockTurnoverArea");
    if(area&&area.style.display!=="none"&&!document.hidden&&!loading)window.loadStockTurnover(true);
  },60000);
  window.closeStockTurnover=function(){
    const area=document.getElementById("stockTurnoverArea");if(area)area.style.display="none";
    if(typeof window.showMainMenu==="function")window.showMainMenu();
    else{const menu=document.getElementById("mainMenu");if(menu)menu.style.display="block";}
  };
})();