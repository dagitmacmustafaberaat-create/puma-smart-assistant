/* BUYAKA PUMA • SALES & LIVE INVENTORY DASHBOARD */
(function(){
  "use strict";
  const SALES_URL="./Sat%C4%B1%C5%9F%20Verileri.xlsx";
  const STOCK_URL="./G%C3%BCncel%20Stok.xlsx";
  const CATEGORIES=["TEKSTİL","AYAKKABI","AKSESUAR"];
  const BUSINESS_UNITS=["SPORTSTYLE PRIME","MOTORSPORT","RTF"];
  const GENDERS=["ERKEK","KADIN","UNISEX"];
  let salesRows=[], stockMap=new Map(), activeTab="overview", filters={bu:"",gender:"",category:""};
  let loading=false, loaded=false;
  const normalize=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleUpperCase("tr-TR").replace(/İ/g,"I").replace(/ı/g,"I").replace(/[^A-Z0-9]+/g," ").trim();
  function num(v){
    if(typeof v==="number"&&Number.isFinite(v))return v;
    let s=String(v??"").trim().replace(/₺|TL|\s/gi,""); if(!s)return 0;
    if(s.includes(",")&&s.includes("."))s=s.replace(/\./g,"").replace(",","."); else if(s.includes(","))s=s.replace(",",".");
    const n=Number(s);return Number.isFinite(n)?n:0;
  }
  const money=v=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:0}).format(v||0);
  const integer=v=>new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}).format(v||0);
  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  function indexOf(headers,aliases){
    const h=headers.map(normalize);
    for(const a of aliases){const i=h.indexOf(normalize(a));if(i>=0)return i;}
    return -1;
  }
  function category(v){
    const x=normalize(v);
    if(/TEKSTIL|APPAREL|TEXTILE|CLOTHING|GARMENT/.test(x))return "TEKSTİL";
    if(/AYAKKABI|FOOTWEAR|SHOES|SHOE/.test(x))return "AYAKKABI";
    if(/AKSESUAR|ACCESSORIES|ACCESSORY/.test(x))return "AKSESUAR";
    return "";
  }
  function gender(v){
    const x=normalize(v);
    if(/KADIN|WOMEN|WOMAN|FEMALE|GIRL/.test(x))return "KADIN";
    if(/ERKEK|MEN|MAN|MALE|BOY/.test(x))return "ERKEK";
    if(/UNISEX|UNISEX/.test(x))return "UNISEX";
    return x;
  }
  function bu(v){
    const x=normalize(v);
    if(x.includes("SPORTSTYLE PRIME")||x==="SPORTSTYLE")return "SPORTSTYLE PRIME";
    if(x.includes("MOTORSPORT")||x==="MOTOR")return "MOTORSPORT";
    if(x==="RTF"||x.includes("RUN TRAIN FITNESS"))return "RTF";
    return x;
  }
  function findSalesHeader(rows){
    return rows.findIndex(row=>{
      const h=row.map(normalize);
      const hasCode=h.some(x=>["URUN KODU","STOK KODU","PRODUCT CODE","STYLE","STYLE NUMBER"].includes(x));
      const hasName=h.some(x=>["URUN ADI","STOK ADI","PRODUCT NAME","DESCRIPTION"].includes(x));
      const hasUnits=h.some(x=>["SATIS ADEDI","NET SATIS ADEDI","SALES UNITS","NET SALES UNITS"].includes(x));
      const hasAmount=h.some(x=>["SATIS TUTARI","NET SATIS TUTARI","SALES AMOUNT","NET SALES AMOUNT"].includes(x));
      const hasCategory=h.some(x=>["KATEGORI","CATEGORY"].includes(x));
      return hasCode&&hasName&&hasUnits&&hasAmount&&hasCategory;
    });
  }
  function stockIndexes(headers){
    const code=indexOf(headers,["STOK KODU","URUN KODU","STOCK CODE","PRODUCT CODE","STYLE NUMBER","STYLE","MODEL KODU","MODEL NO","URUN KOD"]);
    let qty=indexOf(headers,["STOK ADEDİ","STOK ADEDI","STOK ADED","FIILI STOK ADEDI","FIILI STOK ADEDİ","FIILI STOK","MEVCUT STOK","TOPLAM STOK","STOK MIKTARI","STOK MİKTARI","STOCK QTY","STOCK QUANTITY","AVAILABLE STOCK","AVAILABLE QTY","ON HAND QTY","ON HAND","PHYSICAL STOCK","MEVCUT ADET","TOPLAM ADET","MIKTAR","QUANTITY","QTY","ADET","STOK"]);
    if(qty<0)qty=headers.findIndex(v=>{const x=normalize(v);return /(STOK|MIKTAR|ADET|QTY|QUANTITY|ON HAND)/.test(x)&&!/(KOD|CODE|ADI|NAME|GRUP|GROUP|TARIH|DATE)/.test(x);});
    return {code,qty};
  }
  function setStatus(message){const el=document.getElementById("top5DataStatus");if(el)el.textContent=message;}
  function currentRows(){
    return salesRows.filter(r=>(!filters.bu||r.bu===filters.bu)&&(!filters.gender||r.gender===filters.gender)&&(!filters.category||r.category===filters.category));
  }
  function aggregate(rows){
    const map=new Map();
    rows.forEach(r=>{
      if(!map.has(r.code))map.set(r.code,{code:r.code,name:r.name,units:0,amount:0,inventory:stockMap.get(r.code)||0,category:r.category,bu:r.bu,gender:r.gender});
      const p=map.get(r.code);p.units+=r.units;p.amount+=r.amount;if(!p.name&&r.name)p.name=r.name;
    });
    return [...map.values()];
  }
  function filteredSummary(rows){
    const units=rows.reduce((s,r)=>s+r.units,0),amount=rows.reduce((s,r)=>s+r.amount,0);
    const products=aggregate(rows),inventory=products.reduce((s,p)=>s+p.inventory,0);
    return {units,amount,inventory,products,transactions:rows.length};
  }
  function renderFilters(){
    const selects=[["top5FilterBU","bu",BUSINESS_UNITS],["top5FilterGender","gender",GENDERS],["top5FilterCategory","category",CATEGORIES]];
    selects.forEach(([id,key,values])=>{const el=document.getElementById(id);if(!el)return;el.value=filters[key];});
  }
  function renderKPIs(s){
    const defs=[["top5KpiAmount",money(s.amount)],["top5KpiUnits",integer(s.units)],["top5KpiInventory",integer(s.inventory)]];
    defs.forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value;});
  }
  function renderOverview(rows,s){
    const mix=document.getElementById("top5CategoryMix"),leaders=document.getElementById("top5OverviewLeaders");
    if(mix){
      const totals=CATEGORIES.map(c=>({name:c,value:rows.filter(r=>r.category===c).reduce((a,r)=>a+r.units,0)}));
      const max=Math.max(1,...totals.map(x=>x.value));
      mix.innerHTML=totals.map(x=>'<div class="top5-mix-row"><div><b>'+x.name+'</b><strong>'+integer(x.value)+' adet</strong></div><span><i style="width:'+Math.max(2,x.value/max*100)+'%"></i></span></div>').join("")||'<div class="top5-empty">Kategori verisi bulunamadı.</div>';
    }
    if(leaders){
      const top=[...s.products].sort((a,b)=>b.units-a.units).slice(0,5);
      leaders.innerHTML=top.length?top.map((p,i)=>'<div class="top5-mini-row"><b class="top5-mini-rank">'+(i+1)+'</b><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.code)+'</small></div><b>'+integer(p.units)+' adet</b></div>').join(""):'<div class="top5-empty">Filtreye uygun ürün bulunamadı.</div>';
    }
  }
  function renderTop5(s){
    const list=document.getElementById("top5ProductList");
    const summary=document.getElementById("top5CategorySummary");
    if(!list||!summary)return;
    const items=[...s.products].sort((a,b)=>b.units-a.units||b.amount-a.amount).slice(0,5);
    summary.innerHTML="<strong>ÜRÜN TOP 5</strong><span>"+integer(s.products.length)+" ürün • "+integer(s.units)+" adet satış • "+money(s.amount)+"</span>";
    if(!items.length){list.innerHTML='<div class="top5-empty">Seçilen filtrelerde satış kaydı bulunamadı.</div>';return;}
    const max=Math.max(1,...items.map(x=>x.units));
    list.innerHTML=items.map((p,i)=>'<article class="top5-product-card"><div class="top5-rank">'+(i+1)+'</div><div class="top5-product-main"><h3 class="top5-product-name">'+esc(p.name)+'</h3><div class="top5-product-code">ÜRÜN KODU: '+esc(p.code)+'</div><div class="top5-sales-bar"><span style="width:'+Math.max(2,p.units/max*100)+'%"></span></div><div class="top5-metrics"><div class="top5-metric"><small>SATIŞ ADEDİ</small><strong>'+integer(p.units)+'</strong></div><div class="top5-metric"><small>SATIŞ TUTARI</small><strong>'+money(p.amount)+'</strong></div><div class="top5-metric inventory"><small>GÜNCEL STOK</small><strong>'+integer(p.inventory)+'</strong></div></div></div></article>').join("");
  }
  function renderAnalysis(s){
    const el=document.getElementById("top5AnalysisTable");if(!el)return;
    const rows=[...s.products].sort((a,b)=>b.units-a.units);
    el.innerHTML=rows.length?'<div class="top5-table-scroll"><table><thead><tr><th>ÜRÜN KODU</th><th>ÜRÜN ADI</th><th>BU</th><th>CİNSİYET</th><th>KATEGORİ</th><th>SATIŞ ADEDİ</th><th>SATIŞ TUTARI</th><th>GÜNCEL STOK</th></tr></thead><tbody>'+rows.map(p=>'<tr><td>'+esc(p.code)+'</td><td>'+esc(p.name)+'</td><td>'+esc(p.bu)+'</td><td>'+esc(p.gender)+'</td><td>'+esc(p.category)+'</td><td>'+integer(p.units)+'</td><td>'+money(p.amount)+'</td><td>'+integer(p.inventory)+'</td></tr>').join("")+'</tbody></table></div>':'<div class="top5-empty">Analiz için veri bulunamadı.</div>';
  }
  function render(){
    const rows=currentRows(),s=filteredSummary(rows);
    renderFilters();renderKPIs(s);renderOverview(rows,s);renderTop5(s);renderAnalysis(s);
    document.querySelectorAll(".top5-view-tab").forEach(b=>{const active=b.dataset.view===activeTab;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));});
    document.querySelectorAll(".top5-view-panel").forEach(p=>p.hidden=p.dataset.panel!==activeTab);
    const count=document.getElementById("top5FilterSummary");if(count)count.textContent=integer(rows.length)+" satış satırı • "+integer(s.products.length)+" farklı ürün";
  }
  window.setTop5Filter=function(key,value){if(!["bu","gender","category"].includes(key))return;filters[key]=value;render();};
  window.setTop5View=function(tab){if(!["overview","top5","analysis"].includes(tab))return;activeTab=tab;render();};
  window.showTop5Analysis=function(){
    ["mainMenu","productSearchArea","sizeSearchArea","educationArea","shiftProgramArea","sdKarneArea","performanceLeagueArea","fastPerakendeArea","top5AnalysisArea"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=id==="top5AnalysisArea"?"block":"none";});
    window.scrollTo({top:0,behavior:"smooth"});if(!loaded)window.loadTop5Analysis();
  };
  window.closeTop5Analysis=function(){const a=document.getElementById("top5AnalysisArea");if(a)a.style.display="none";if(typeof window.showMainMenu==="function")window.showMainMenu();};
  window.loadTop5Analysis=async function(){
    if(loading)return;loading=true;setStatus("Satış ve güncel stok Excel raporları okunuyor…");
    const list=document.getElementById("top5ProductList");if(list)list.innerHTML='<div class="top5-empty">Raporlar okunuyor…</div>';
    try{
      if(!window.XLSX)throw new Error("Excel okuma bileşeni yüklenemedi. Sayfayı yenileyin.");
      const [sr,tr]=await Promise.all([fetch(SALES_URL+"?v="+Date.now(),{cache:"no-store"}),fetch(STOCK_URL+"?v="+Date.now(),{cache:"no-store"})]);
      if(!sr.ok)throw new Error("Satış Verileri.xlsx açılamadı ("+sr.status+").");
      if(!tr.ok)throw new Error("Güncel Stok.xlsx açılamadı ("+tr.status+").");
      const [sb,tb]=await Promise.all([sr.arrayBuffer(),tr.arrayBuffer()]);
      const sw=XLSX.read(sb,{type:"array"}),tw=XLSX.read(tb,{type:"array"});
      if(!sw.SheetNames.length||!tw.SheetNames.length)throw new Error("Excel dosyalarında çalışma sayfası bulunamadı.");
      const rows=XLSX.utils.sheet_to_json(sw.Sheets[sw.SheetNames[0]],{header:1,defval:"",raw:true});
      const stockRows=XLSX.utils.sheet_to_json(tw.Sheets[tw.SheetNames[0]],{header:1,defval:"",raw:true});
      const hi=findSalesHeader(rows);
      if(hi<0)throw new Error("Satış Excel başlıkları tanınamadı. Beklenen: Cinsiyet, Kategori, Business Unit, Ürün kodu, Ürün Adı, Satış Adedi, Satış Tutarı.");
      const h=rows[hi],ix={
        gender:indexOf(h,["Cinsiyet","Gender"]),category:indexOf(h,["Kategori","Category"]),
        bu:indexOf(h,["Business Unit","BU"]),code:indexOf(h,["Ürün kodu","Ürün Kodu","Stok Kodu","Product Code","Style"]),
        name:indexOf(h,["Ürün Adı","Stok Adı","Product Name","Description"]),
        units:indexOf(h,["Satış Adedi","Net Satış Adedi","Sales Units","Net Sales Units"]),
        amount:indexOf(h,["Satış Tutarı","Net Satış Tutarı","Sales Amount","Net Sales Amount"])
      };
      if(Object.values(ix).some(v=>v<0))throw new Error("Satış Excel başlıklarından biri eksik. Yeni başlık düzenini kontrol edin.");
      const sh=stockRows.findIndex(row=>{const x=stockIndexes(row);return x.code>=0&&x.qty>=0;});
      if(sh<0)throw new Error("Güncel Stok Excel başlıkları tanınamadı. Ürün/Stok kodu ve stok miktarı sütunları bulunamadı.");
      const sx=stockIndexes(stockRows[sh]);stockMap=new Map();
      stockRows.slice(sh+1).forEach(row=>{const code=String(row[sx.code]??"").trim();if(!code)return;stockMap.set(code,(stockMap.get(code)||0)+num(row[sx.qty]));});
      salesRows=rows.slice(hi+1).map(row=>({
        gender:gender(row[ix.gender]),category:category(row[ix.category]),bu:bu(row[ix.bu]),
        code:String(row[ix.code]??"").trim(),name:String(row[ix.name]??"").trim(),
        units:num(row[ix.units]),amount:num(row[ix.amount])
      })).filter(r=>r.code&&r.category);
      if(!salesRows.length)throw new Error("Başlıklar bulundu ancak satış satırı okunamadı. Excel veri satırlarını kontrol edin.");
      loaded=true;render();
      setStatus("✓ Satış ve stok dosyaları eşleştirildi • "+integer(salesRows.length)+" satış satırı • "+integer(stockMap.size)+" stok kodu • "+new Date().toLocaleString("tr-TR"));
    }catch(e){console.error("BUYAKA SALES REPORT:",e);setStatus("Veri yüklenemedi: "+e.message);if(list)list.innerHTML='<div class="top5-empty">'+esc(e.message)+'</div>';}
    finally{loading=false;}
  };
})();