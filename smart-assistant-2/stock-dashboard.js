(function(){
const DATA_URL="./data/stock-sales-dashboard.json.gz.b64";
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
const nf=new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}),nf1=new Intl.NumberFormat("tr-TR",{maximumFractionDigits:1}),money=v=>"₺ "+nf.format(v||0),num=v=>nf.format(v||0),dec=v=>nf1.format(v||0);
function status(r){if(r.stock<=0)return "Stok yok";if(r.days<15)return "Düşük";if(r.days<=60)return "Dengeli";if(r.days<=120)return "Yüksek";return "Fazla";}
const categories=[{k:"ALL",n:"Tümü",d:"FTW + APP + ACC",c:"#374151"},{k:"FTW",n:"FTW",d:"Ayakkabı (Footwear)",c:"#1d4ed8"},{k:"APP",n:"APP",d:"Tekstil (Apparel)",c:"#b45309"},{k:"ACC",n:"ACC",d:"Aksesuar (Accessories)",c:"#0f766e"}];
async function loadData(){
 const response=await fetch(DATA_URL,{cache:"no-store"});if(!response.ok)throw new Error("Dashboard veri dosyasına ulaşılamadı ("+response.status+").");
 const b64=(await response.text()).trim(),binary=atob(b64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 if(!("DecompressionStream" in window))throw new Error("Bu tarayıcı sıkıştırılmış dashboard verisini açamıyor. Tarayıcıyı güncelleyin.");
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
 return JSON.parse(await new Response(stream).text());
}
function init(host){
 if(!host||host.querySelector(".stockdash"))return;
 const intro=host.querySelector(".sales-report-intro");if(!intro)return;
 const root=document.createElement("section");root.className="stockdash";root.innerHTML='<div class="stockdash-head"><div><h3>Kategori Bazlı Satış ve Stok Dashboard</h3><div class="stockdash-sub" id="sd-sub">Excel verileri yükleniyor…</div></div><span class="stockdash-source">25 GÜNLÜK SATIŞ · GÜNCEL STOK</span></div><div class="stockdash-cats" id="sd-cats"></div><div class="stockdash-kpis" id="sd-kpis"></div><div class="stockdash-grid"><section class="stockdash-panel"><h4 id="sd-top-title">En çok ciro yapan 10 ürün</h4><div id="sd-top"></div></section><section class="stockdash-panel"><h4>Stok durumu dağılımı (ürün sayısı)</h4><div id="sd-status"></div><div class="stockdash-note">Düşük: 15 günden az · Dengeli: 15–60 gün · Yüksek: 60–120 gün · Fazla: 120 günden çok · Stok yok: stok 0</div></section></div><div class="stockdash-grid"><section class="stockdash-panel"><h4>Acil ikmal: stok yok / düşük (satışa göre)</h4><div id="sd-risk"></div></section><section class="stockdash-panel"><h4>Fazla stok: en yüksek stoklu ürünler</h4><div id="sd-over"></div></section></div><section class="stockdash-panel"><h4>Ürün detayı</h4><div class="stockdash-tools"><label>Ara: <input id="sd-q" type="search" placeholder="Ürün adı veya stok kodu"></label><label>Durum: <select id="sd-filter"><option value="">Tümü</option><option>Stok yok</option><option>Düşük</option><option>Dengeli</option><option>Yüksek</option><option>Fazla</option></select></label><span class="stockdash-note" id="sd-count" aria-live="polite"></span></div><div class="stockdash-tablewrap"><table><thead><tr id="sd-th"></tr></thead><tbody id="sd-tb"></tbody></table></div><div class="stockdash-tools"><button class="stockdash-more" id="sd-more" type="button">Daha fazla göster</button></div></section>';
 intro.insertAdjacentElement("afterend",root);
 loadData().then(payload=>{
  const rows=(payload.rows||[]).map(r=>({...r,status:status(r)}));
  const state={cat:"ALL",q:"",st:"",sort:"qty",dir:-1,limit:50,rows};
  const cat=()=>categories.find(c=>c.k===state.cat);
  const inCat=r=>state.cat==="ALL"||r.category===state.cat;
  const agg=list=>{const a={n:list.length,qty:0,amount:0,stock:0,daily:0,zero:0,low:0,over:0};list.forEach(r=>{a.qty+=r.qty;a.amount+=r.amount;a.stock+=r.stock;a.daily+=r.daily;if(r.status==="Stok yok")a.zero++;if(r.status==="Düşük")a.low++;if(r.status==="Fazla")a.over++;});a.cover=a.daily?a.stock/a.daily:0;return a;};
  const barList=(id,items,label,val,format,empty)=>{const box=root.querySelector("#"+id);if(!items.length){box.innerHTML='<div class="stockdash-empty">'+(empty||"Gösterilecek kayıt yok.")+'</div>';return;}const max=Math.max(1,...items.map(val));box.innerHTML=items.map(it=>'<div class="stockdash-row"><div class="stockdash-name" title="'+esc(label(it))+'">'+esc(label(it))+'</div><div class="stockdash-bar"><i style="width:'+Math.max(2,val(it)/max*100)+'%;background:'+cat().c+'"></i></div><div class="stockdash-value">'+esc(format(it))+'</div></div>').join("");};
  function render(){
   const selected=rows.filter(inCat),a=agg(selected),all=agg(rows),c=cat();
   root.querySelector("#sd-cats").innerHTML=categories.map(x=>{const z=agg(rows.filter(r=>x.k==="ALL"||r.category===x.k));return '<button class="stockdash-cat" style="--sd-cat:'+x.c+'" data-cat="'+x.k+'" aria-pressed="'+(state.cat===x.k)+'"><div class="stockdash-cat-name">'+x.n+'</div><div class="stockdash-cat-desc">'+x.d+'</div><div class="stockdash-cat-metrics"><span>Ciro<b>'+money(z.amount)+'</b></span><span>Adet<b>'+num(z.qty)+'</b></span><span>Stok<b>'+num(z.stock)+'</b></span></div></button>';}).join("");
   root.querySelectorAll("[data-cat]").forEach(b=>b.addEventListener("click",()=>{state.cat=b.dataset.cat;state.limit=50;render();}));
   const kpis=[["Ürün (SKU) sayısı",num(a.n),"satışı olan kayıt"],["Satış adedi (25 gün)",num(a.qty),"ort. "+dec(a.daily)+" adet/gün"],["Net satış tutarı",money(a.amount),"adet başı ort. "+money(a.qty?a.amount/a.qty:0)],["Güncel stok",num(a.stock)+" adet","toplam"],["Stok karşılama",dec(a.cover)+" gün","toplam stok / günlük satış"],["Stok yok",num(a.zero)+" SKU","satışı olup stoğu 0 olan"],["Düşük stok (<15 gün)",num(a.low)+" SKU","ikmal adayı"],["Fazla stok (>120 gün)",num(a.over)+" SKU","indirim / transfer adayı"]];
   root.querySelector("#sd-kpis").innerHTML=kpis.map(x=>'<div class="stockdash-kpi" style="--sd-cat:'+c.c+'"><small>'+x[0]+'</small><strong>'+x[1]+'</strong><span>'+x[2]+'</span></div>').join("");
   root.querySelector("#sd-top-title").textContent="En çok ciro yapan 10 ürün"+(state.cat==="ALL"?"":" - "+state.cat);
   barList("sd-top",selected.slice().sort((x,y)=>y.amount-x.amount).slice(0,10),r=>r.name+" ("+r.sku+")",r=>r.amount,r=>money(r.amount)+" · "+num(r.qty)+" ad.");
   const order=["Stok yok","Düşük","Dengeli","Yüksek","Fazla"],counts=order.map(s=>({s,n:selected.filter(r=>r.status===s).length}));
   barList("sd-status",counts,x=>x.s,x=>x.n,x=>num(x.n)+" SKU");
   const risk=selected.filter(r=>r.status==="Stok yok"||r.status==="Düşük").sort((x,y)=>y.qty-x.qty||y.amount-x.amount).slice(0,10);
   barList("sd-risk",risk,r=>r.name+" ("+r.sku+")",r=>r.qty,r=>num(r.qty)+" sat. · stok "+num(r.stock),"Riskli ürün yok.");
   const over=selected.filter(r=>r.stock>0).sort((x,y)=>y.stock-x.stock).slice(0,10);
   barList("sd-over",over,r=>r.name+" ("+r.sku+")",r=>r.stock,r=>num(r.stock)+" ad. · "+dec(r.days)+" gün");
   root.querySelector("#sd-sub").textContent="25 günlük satış ve güncel stok · "+num(all.n)+" ürün · Seçili: "+c.d+" · Kaynak: "+payload.source;
   renderTable(selected);
  }
  const cols=[["category","Kategori",0],["sku","Stok kodu",0],["name","Ürün adı",0],["qty","Satış adedi",1],["amount","Net satış (₺)",1],["stock","Stok",1],["daily","Günlük ort.",1],["days","Karşılama (gün)",1],["status","Durum",0]];
  function renderTable(list){
   root.querySelector("#sd-th").innerHTML=cols.map(col=>'<th class="'+(col[2]?"sd-right":"")+'"><button type="button" data-sort="'+col[0]+'">'+col[1]+(state.sort===col[0]?(state.dir>0?" ▲":" ▼"):"")+'</button></th>').join("");
   root.querySelectorAll("[data-sort]").forEach(b=>b.addEventListener("click",()=>{if(state.sort===b.dataset.sort)state.dir*=-1;else{state.sort=b.dataset.sort;state.dir=cols.find(x=>x[0]===state.sort)[2]?-1:1;}renderTable(list);}));
   const q=state.q.toLocaleLowerCase("tr-TR");let filtered=list.filter(r=>(!q||(r.name+" "+r.sku).toLocaleLowerCase("tr-TR").includes(q))&&(!state.st||r.status===state.st));
   filtered.sort((x,y)=>{const a=x[state.sort],b=y[state.sort],v=typeof a==="number"?a-b:String(a).localeCompare(String(b),"tr");return v*state.dir;});
   root.querySelector("#sd-tb").innerHTML=filtered.slice(0,state.limit).map(r=>'<tr><td>'+esc(r.category)+'</td><td>'+esc(r.sku)+'</td><td>'+esc(r.name)+'</td><td class="sd-right">'+num(r.qty)+'</td><td class="sd-right">'+money(r.amount).replace("₺ ","")+'</td><td class="sd-right">'+num(r.stock)+'</td><td class="sd-right">'+dec(r.daily)+'</td><td class="sd-right">'+dec(r.days)+'</td><td><span class="stockdash-tag stockdash-t'+({"Stok yok":0,"Düşük":1,"Dengeli":2,"Yüksek":3,"Fazla":4}[r.status])+'">'+r.status+'</span></td></tr>').join("")||'<tr><td colspan="9" style="text-align:center">Filtreye uyan ürün yok.</td></tr>';
   root.querySelector("#sd-count").textContent=num(Math.min(state.limit,filtered.length))+" / "+num(filtered.length)+" ürün gösteriliyor";
   root.querySelector("#sd-more").style.display=filtered.length>state.limit?"":"none";
  }
  root.querySelector("#sd-q").addEventListener("input",e=>{state.q=e.target.value;state.limit=50;renderTable(rows.filter(inCat));});
  root.querySelector("#sd-filter").addEventListener("change",e=>{state.st=e.target.value;state.limit=50;renderTable(rows.filter(inCat));});
  root.querySelector("#sd-more").addEventListener("click",()=>{state.limit+=100;renderTable(rows.filter(inCat));});
  render();
 }).catch(e=>{root.querySelector("#sd-sub").textContent="Dashboard verisi yüklenemedi: "+e.message;});
}
window.initStockSalesDashboard=init;
})();