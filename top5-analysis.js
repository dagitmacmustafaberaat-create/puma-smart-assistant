/* BUYAKA PUMA - Category Top 5 analysis */
(function(){
  "use strict";
  const SALES_URL="./Sat%C4%B1%C5%9F%20Verileri.xlsx";
  const STOCK_URL="./data.json";
  const categories=["TEKSTİL","AYAKKABI","AKSESUAR"];
  let categoryData={};
  let selectedCategory="TEKSTİL";
  let loading=false;

  function normalize(value){
    return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleUpperCase("tr-TR").replace(/İ/g,"I").replace(/ı/g,"I").replace(/[^A-Z0-9]+/g," ").trim();
  }
  function numberValue(value){
    if(typeof value==="number" && Number.isFinite(value)) return value;
    let s=String(value??"").trim();
    if(!s) return 0;
    s=s.replace(/₺|TL|\s/gi,"");
    if(s.includes(",") && s.includes(".")) s=s.replace(/\./g,"").replace(",",".");
    else if(s.includes(",")) s=s.replace(",",".");
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  }
  function formatNumber(value){
    return new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}).format(value||0);
  }
  function formatMoney(value){
    return new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(value||0);
  }
  function classifyCategory(value){
    const c=normalize(value);
    if(/TEKSTIL|APPAREL|TEXTILE|CLOTHING|GARMENT/.test(c)) return "TEKSTİL";
    if(/AYAKKABI|FOOTWEAR|SHOES|SHOE/.test(c)) return "AYAKKABI";
    if(/AKSESUAR|ACCESSORIES|ACCESSORY/.test(c)) return "AKSESUAR";
    return "";
  }
  function findHeaderIndex(rows){
    return rows.findIndex(row=>{
      const cells=row.map(normalize);
      return cells.includes("STOK KODU") && cells.includes("STOK ADI") &&
        cells.includes("NET SATIS ADED") && cells.includes("NET SATIS TUTARI") && cells.includes("KATEGORI");
    });
  }
  function render(){
    const list=document.getElementById("top5ProductList");
    const summary=document.getElementById("top5CategorySummary");
    if(!list||!summary) return;
    document.querySelectorAll(".top5-category-tab").forEach(btn=>{
      const active=btn.dataset.top5Category===selectedCategory;
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-pressed",String(active));
    });
    const items=categoryData[selectedCategory]||[];
    const totalUnits=items.reduce((sum,item)=>sum+item.units,0);
    const totalAmount=items.reduce((sum,item)=>sum+item.amount,0);
    const totalInventory=items.reduce((sum,item)=>sum+item.inventory,0);
    summary.innerHTML="<strong>"+selectedCategory+" • TOP 5</strong><span>Top 5 net satış: "+formatNumber(totalUnits)+" adet&nbsp; • &nbsp;"+formatMoney(totalAmount)+"&nbsp; • &nbsp;Envanter: "+formatNumber(totalInventory)+"</span>";
    if(!items.length){
      list.innerHTML='<div class="top5-empty">Bu kategori için satış kaydı bulunamadı. Excel raporundaki KATEGORİ değerlerini kontrol edin.</div>';
      return;
    }
    const maxUnits=Math.max(...items.map(x=>x.units),1);
    list.innerHTML=items.map((item,index)=>{
      const width=Math.max(3,item.units/maxUnits*100);
      return '<article class="top5-product-card">'+
        '<div class="top5-rank">'+(index+1)+'</div>'+
        '<div class="top5-product-main">'+
          '<h3 class="top5-product-name">'+escapeHtml(item.name)+'</h3>'+
          '<div class="top5-product-code">STOK KODU: '+escapeHtml(item.code)+'</div>'+
          '<div class="top5-sales-bar"><span style="width:'+width+'%"></span></div>'+
          '<div class="top5-metrics">'+
            '<div class="top5-metric"><small>NET SATIŞ ADEDİ</small><strong>'+formatNumber(item.units)+'</strong></div>'+
            '<div class="top5-metric"><small>NET SATIŞ TUTARI</small><strong>'+formatMoney(item.amount)+'</strong></div>'+
            '<div class="top5-metric inventory"><small>GÜNCEL ENVANTER</small><strong>'+formatNumber(item.inventory)+'</strong></div>'+
          '</div>'+
        '</div></article>';
    }).join("");
  }
  function escapeHtml(value){
    return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
  window.selectTop5Category=function(category){
    if(!categories.includes(category)) return;
    selectedCategory=category;
    render();
  };
  window.showTop5Analysis=function(){
    ["mainMenu","productSearchArea","sizeSearchArea","educationArea","shiftProgramArea","sdKarneArea","performanceLeagueArea","fastPerakendeArea","top5AnalysisArea"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.style.display=id==="top5AnalysisArea"?"block":"none";
    });
    window.scrollTo({top:0,behavior:"smooth"});
    if(!Object.keys(categoryData).length) window.loadTop5Analysis();
  };
  window.closeTop5Analysis=function(){
    const area=document.getElementById("top5AnalysisArea");
    if(area) area.style.display="none";
    if(typeof window.showMainMenu==="function") window.showMainMenu();
  };
  window.loadTop5Analysis=async function(){
    const status=document.getElementById("top5DataStatus");
    const list=document.getElementById("top5ProductList");
    if(loading) return;
    loading=true;
    if(status) status.textContent="Satış ve güncel stok Excel raporları okunuyor…";
    if(list) list.innerHTML='<div class="top5-empty">Raporlar okunuyor…</div>';
    try{
      if(!window.XLSX) throw new Error("Excel okuma bileşeni yüklenemedi. Sayfayı yenileyin.");
      const [salesResponse,stockResponse]=await Promise.all([
        fetch(SALES_URL+"?v="+Date.now(),{cache:"no-store"}),
        fetch(STOCK_URL+"?v="+Date.now(),{cache:"no-store"})
      ]);
      if(!salesResponse.ok) throw new Error("Satış Verileri.xlsx dosyası açılamadı ("+salesResponse.status+").");
      if(!stockResponse.ok) throw new Error("Güncel stok verisi açılamadı ("+stockResponse.status+").");
      const [salesBuffer,stockRows]=await Promise.all([salesResponse.arrayBuffer(),stockResponse.json()]);
      if(!Array.isArray(stockRows)) throw new Error("Güncel stok verisi beklenen formatta değil.");
      const workbook=XLSX.read(salesBuffer,{type:"array",cellDates:false});
      const sheetName=workbook.SheetNames[0];
      if(!sheetName) throw new Error("Satış Excel dosyasında çalışma sayfası bulunamadı.");
      const rows=XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{header:1,defval:"",raw:true});
      const headerIndex=findHeaderIndex(rows);
      if(headerIndex<0) throw new Error("Satış Excel'inde gerekli başlık satırı bulunamadı. STOK KODU, STOK ADI, KATEGORİ, NET SATIŞ ADEDİ ve NET SATIŞ TUTARI başlıklarını kontrol edin.");
      const headers=rows[headerIndex].map(normalize);
      const col=name=>headers.indexOf(normalize(name));
      const ix={category:col("KATEGORİ"),code:col("STOK KODU"),name:col("STOK ADI"),units:col("NET SATIŞ ADEDİ"),amount:col("NET SATIŞ TUTARI")};
      const inventory=new Map();
      stockRows.forEach(row=>{
        const code=String(row.productCode??row["STOK KODU"]??row["Stok Kodu"]??"").trim();
        if(!code) return;
        inventory.set(code,(inventory.get(code)||0)+numberValue(row.stock??row["STOK ADEDİ"]??row["STOK"]??0));
      });
      const groups={TEKSTİL:new Map(),AYAKKABI:new Map(),AKSESUAR:new Map()};
      rows.slice(headerIndex+1).forEach(row=>{
        const category=classifyCategory(row[ix.category]);
        const code=String(row[ix.code]??"").trim();
        if(!category||!code) return;
        const name=String(row[ix.name]??"").trim();
        const units=numberValue(row[ix.units]);
        const amount=numberValue(row[ix.amount]);
        if(!groups[category].has(code)) groups[category].set(code,{code,name,units:0,amount:0,inventory:inventory.get(code)||0});
        const item=groups[category].get(code);
        item.units+=units;
        item.amount+=amount;
        if(!item.name&&name) item.name=name;
      });
      categoryData={};
      categories.forEach(category=>{
        categoryData[category]=[...groups[category].values()]
          .sort((a,b)=>b.units-a.units||b.amount-a.amount)
          .slice(0,5);
      });
      render();
      const totalRows=rows.length-headerIndex-1;
      if(status) status.textContent="✓ Satış raporu ve güncel envanter eşleştirildi • "+formatNumber(totalRows)+" satır incelendi • "+new Date().toLocaleString("tr-TR");
    }catch(error){
      console.error("TOP 5 RAPOR HATASI:",error);
      if(status) status.textContent="Veri yüklenemedi: "+error.message;
      if(list) list.innerHTML='<div class="top5-empty">'+escapeHtml(error.message)+'</div>';
    }finally{
      loading=false;
    }
  };
})();
