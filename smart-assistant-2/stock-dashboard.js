(function(){
const DATA_URL="./data/monthly-sales-dashboard.json.gz.b64";
const nf=new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}),nf2=new Intl.NumberFormat("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
const money=v=>"₺ "+nf.format(v||0),num=v=>nf.format(v||0),dec=v=>nf2.format(v||0);
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function loadData(){
 const response=await fetch(DATA_URL,{cache:"no-store"});if(!response.ok)throw new Error("Aylık satış Excel verisine ulaşılamadı ("+response.status+").");
 const b64=(await response.text()).trim(),binary=atob(b64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 if(!("DecompressionStream" in window))throw new Error("Tarayıcı sıkıştırılmış Excel verisini açamıyor.");
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
 return JSON.parse(await new Response(stream).text());
}
function init(host){
 if(!host||host.querySelector(".stockdash"))return;
 const intro=host.querySelector(".sales-report-intro");if(!intro)return;
 const root=document.createElement("section");root.className="stockdash";root.innerHTML=
 '<div class="msd-head"><div><div class="msd-eyebrow">BUYAKA · MONTHLY SALES INTELLIGENCE</div><h3>Aylık Ürün Satış Dashboard</h3><p id="msd-source">Excel verileri yükleniyor…</p></div><span class="msd-live">EXCEL VERİSİ</span></div>'+
 '<div class="msd-kpis" id="msd-kpis"></div>'+
 '<div class="msd-section"><div class="msd-section-title"><h4>Kategori Performansı</h4><span>Ciro · Satış adedi · Ciro payı</span></div><div class="msd-category" id="msd-category"></div></div>'+
 '<div class="msd-grid"><section class="msd-panel"><div class="msd-section-title"><h4>Cinsiyet Dağılımı</h4><span>Ciro ve adet</span></div><div id="msd-gender"></div></section><section class="msd-panel"><div class="msd-section-title"><h4>Business Unit Performansı</h4><span>Cirolara göre sıralı</span></div><div id="msd-bu"></div></section></div>'+
 '<div class="msd-grid"><section class="msd-panel"><div class="msd-section-title"><h4>Ciroya Göre İlk 10 Ürün</h4><span>Net satış tutarı</span></div><div id="msd-top-amount"></div></section><section class="msd-panel"><div class="msd-section-title"><h4>Adede Göre İlk 10 Ürün</h4><span>Net satış adedi</span></div><div id="msd-top-qty"></div></section></div>'+
 '<section class="msd-panel msd-products"><div class="msd-section-title"><h4>Ürün Detay Tablosu</h4><span id="msd-count"></span></div><div class="msd-filters"><input id="msd-search" type="search" placeholder="Ürün adı veya stok kodu ara…"><select id="msd-cat"><option value="">Tüm kategoriler</option></select><select id="msd-gender-filter"><option value="">Tüm cinsiyetler</option></select><select id="msd-bu-filter"><option value="">Tüm Business Unit</option></select><select id="msd-sort"><option value="amount-desc">Ciro · Çoktan aza</option><option value="amount-asc">Ciro · Azdan çoğa</option><option value="qty-desc">Adet · Çoktan aza</option><option value="qty-asc">Adet · Azdan çoğa</option><option value="name-asc">Ürün adı · A-Z</option></select></div><div class="msd-table-wrap"><table><thead><tr><th>CİNSİYET</th><th>KATEGORİ</th><th>BUSINESS UNIT</th><th>STOK KODU</th><th>STOK ADI</th><th class="right">SATIŞ ADEDİ</th><th class="right">NET SATIŞ TUTARI</th></tr></thead><tbody id="msd-tbody"></tbody></table></div><div class="msd-footer"><span id="msd-showing"></span><button type="button" id="msd-more">Daha fazla göster</button></div></section>';
 intro.insertAdjacentElement("afterend",root);
 loadData().then(payload=>{
  const rows=payload.rows||[];
  const total=list=>list.reduce((a,r)=>{a.qty+=r.qty;a.amount+=r.amount;return a;},{qty:0,amount:0});
  const grand=total(rows),skuCount=new Set(rows.map(r=>r.sku)).size,avg=grand.qty?grand.amount/grand.qty:0;
  const group=(key)=>{const map=new Map();rows.forEach(r=>{const k=r[key]||"Belirtilmemiş";if(!map.has(k))map.set(k,{name:k,qty:0,amount:0,count:0});const x=map.get(k);x.qty+=r.qty;x.amount+=r.amount;x.count++;});return [...map.values()].sort((a,b)=>b.amount-a.amount);};
  const categories=group("category"),genders=group("gender"),units=group("businessUnit");
  const pct=v=>grand.amount?v/grand.amount*100:0;
  root.querySelector("#msd-source").textContent=rows.length+" ürün kaydı · Kaynak: "+payload.source+" · Tutarlar KDV hariç";
  root.querySelector("#msd-kpis").innerHTML=[["NET CİRO",money(grand.amount),"KDV hariç"],["NET SATIŞ ADEDİ",num(grand.qty),"Toplam ürün adedi"],["ÜRÜN / SKU",num(skuCount),"Farklı stok kodu"],["ORT. ÜRÜN TUTARI",money(avg),"Net ciro / satış adedi"]].map(x=>'<div class="msd-kpi"><small>'+x[0]+'</small><strong>'+x[1]+'</strong><span>'+x[2]+'</span></div>').join("");
  function barRows(id,list,mode){
   const el=root.querySelector("#"+id);const max=Math.max(1,...list.map(x=>mode==="qty"?x.qty:x.amount));
   el.innerHTML=list.map(x=>{const value=mode==="qty"?x.qty:x.amount;return '<div class="msd-bar-row"><div class="msd-bar-top"><b>'+esc(x.name)+'</b><span>'+ (mode==="qty"?num(x.qty)+" adet":money(x.amount))+'</span></div><div class="msd-track"><i style="width:'+Math.max(1,value/max*100)+'%"></i></div><small>'+ (mode==="category"?num(x.qty)+" adet · "+dec(pct(x.amount))+"% ciro payı":mode==="gender"?money(x.amount)+" · "+num(x.qty)+" adet":num(x.count)+" ürün kaydı · "+num(x.qty)+" adet")+'</small></div>';}).join("")||'<div class="msd-empty">Kayıt bulunamadı.</div>';
  }
  root.querySelector("#msd-category").innerHTML=categories.map(x=>'<div class="msd-category-card"><div class="msd-category-top"><b>'+esc(x.name)+'</b><strong>'+dec(pct(x.amount))+'%</strong></div><div class="msd-track"><i style="width:'+pct(x.amount)+'%"></i></div><div class="msd-category-bottom"><span>'+money(x.amount)+'</span><span>'+num(x.qty)+' adet</span></div></div>').join("");
  barRows("msd-gender",genders,"gender");barRows("msd-bu",units,"bu");
  const topAmount=rows.slice().sort((a,b)=>b.amount-a.amount).slice(0,10).map(r=>({...r,name:r.name+" · "+r.sku,count:r.qty}));
  const topQty=rows.slice().sort((a,b)=>b.qty-a.qty||b.amount-a.amount).slice(0,10).map(r=>({...r,name:r.name+" · "+r.sku,count:r.qty}));
  barRows("msd-top-amount",topAmount,"amount");barRows("msd-top-qty",topQty,"qty");
  const fill=(id,values)=>{const select=root.querySelector("#"+id);[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"tr")).forEach(v=>select.add(new Option(v,v)));};
  fill("msd-cat",rows.map(r=>r.category));fill("msd-gender-filter",rows.map(r=>r.gender));fill("msd-bu-filter",rows.map(r=>r.businessUnit));
  const state={q:"",category:"",gender:"",bu:"",sort:"amount-desc",limit:50};
  function renderTable(){
   let list=rows.filter(r=>(!state.q||(r.name+" "+r.sku).toLocaleLowerCase("tr-TR").includes(state.q))&&(!state.category||r.category===state.category)&&(!state.gender||r.gender===state.gender)&&(!state.bu||r.businessUnit===state.bu));
   list.sort((a,b)=>{if(state.sort==="name-asc")return a.name.localeCompare(b.name,"tr");const [key,dir]=state.sort.split("-");return (key==="qty"?a.qty-b.qty:a.amount-b.amount)*(dir==="asc"?1:-1);});
   root.querySelector("#msd-tbody").innerHTML=list.slice(0,state.limit).map(r=>'<tr><td>'+esc(r.gender)+'</td><td>'+esc(r.category)+'</td><td>'+esc(r.businessUnit||"—")+'</td><td>'+esc(r.sku)+'</td><td>'+esc(r.name)+'</td><td class="right">'+num(r.qty)+'</td><td class="right">'+money(r.amount)+'</td></tr>').join("")||'<tr><td colspan="7" class="msd-no-results">Filtreye uygun ürün bulunamadı.</td></tr>';
   root.querySelector("#msd-count").textContent=num(list.length)+" kayıt";
   root.querySelector("#msd-showing").textContent=num(Math.min(state.limit,list.length))+" / "+num(list.length)+" ürün gösteriliyor";
   root.querySelector("#msd-more").hidden=list.length<=state.limit;
  }
  [["msd-search","q"],["msd-cat","category"],["msd-gender-filter","gender"],["msd-bu-filter","bu"],["msd-sort","sort"]].forEach(([id,key])=>root.querySelector("#"+id).addEventListener(id==="msd-search"?"input":"change",e=>{state[key]=e.target.value.toLocaleLowerCase&&key==="q"?e.target.value.toLocaleLowerCase("tr-TR"):e.target.value;state.limit=50;renderTable();}));
  root.querySelector("#msd-more").addEventListener("click",()=>{state.limit+=50;renderTable();});
  renderTable();
 }).catch(e=>{root.querySelector("#msd-source").textContent="Dashboard verisi yüklenemedi: "+e.message;});
}
window.initStockSalesDashboard=init;
})();