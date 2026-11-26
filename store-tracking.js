(function(){
"use strict";
var cache=null;
function $ (id){return document.getElementById(id);}
function n(v){if(typeof v==="number")return v;var s=String(v==null?"":v).replace(/\s/g,"").replace(/[^\d,.\-]/g,"");if(s.indexOf(",")>=0)s=s.replace(/\./g,"").replace(",",".");else if((s.match(/\./g)||[]).length>1)s=s.replace(/\./g,"");return Number(s)||0;}
function f(v,d){return Number(v||0).toLocaleString("tr-TR",{minimumFractionDigits:d||0,maximumFractionDigits:d||0});}
function money(v){return f(v)+" TL";}
function norm(v){return String(v||"").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").trim();}
function date(v){if(typeof v==="number"&&v>20000&&v<80000){var x=new Date(Date.UTC(1899,11,30)+v*86400000);return {d:x.getUTCDate(),m:x.getUTCMonth()+1,y:x.getUTCFullYear()};}var z=String(v||"").match(/(\d{1,2})[./-](\d{1,2})[./-](20\d{2})/);return z?{d:+z[1],m:+z[2],y:+z[3]}:null;}
function load(){if(cache)return Promise.resolve(cache);if(!window.XLSX)return Promise.reject(Error("Excel okuyucu yüklenemedi."));return fetch("https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/2025-2026%20Kar%C5%9F%C4%B1la%C5%9Ft%C4%B1rma%20Yeni.xlsx",{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("Excel dosyası açılamadı: "+r.status);return r.arrayBuffer();}).then(function(b){cache=window.XLSX.read(b,{type:"array"});return cache;});}
function parse(wb){
 var out={2025:[],2026:[]},targets={};
 wb.SheetNames.forEach(function(name){
  var rows=window.XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:"",raw:true}),headers=[];
  for(var hi=0;hi<rows.length;hi++){var h=rows[hi].map(norm);if(h.indexOf("tarih")>=0&&h.indexOf("actual")>=0&&h.indexOf("transaction")>=0&&h.indexOf("units")>=0)headers.push({row:hi,h:h});}
  headers.forEach(function(block,bi){
   var h=block.h,start=block.row+1,end=bi+1<headers.length?headers[bi+1].row:rows.length;
   function ix(names){for(var j=0;j<names.length;j++){var k=h.indexOf(norm(names[j]));if(k>=0)return k;}return -1;}
   var c={date:ix(["tarih"]),target:ix(["target"]),actual:ix(["actual"]),invoice:ix(["transaction"]),units:ix(["units"]),traffic:ix(["visitors"]),ftw:ix(["ftw"]),app:ix(["app"]),acc:ix(["acc"])};
   for(var ri=start;ri<end;ri++){
    var r=rows[ri],dt=date(r[c.date>=0?c.date:0]);if(!dt||(dt.y!==2025&&dt.y!==2026))continue;
    var rev=c.actual>=0?n(r[c.actual]):0,inv=c.invoice>=0?n(r[c.invoice]):0,units=c.units>=0?n(r[c.units]):0,traffic=c.traffic>=0?n(r[c.traffic]):0;
    var cat={ftw:c.ftw>=0&&String(r[c.ftw]||"").trim()!==""?n(r[c.ftw]):null,app:c.app>=0&&String(r[c.app]||"").trim()!==""?n(r[c.app]):null,acc:c.acc>=0&&String(r[c.acc]||"").trim()!==""?n(r[c.acc]):null};
    if(!(rev||inv||units||traffic||cat.ftw!==null||cat.app!==null||cat.acc!==null))continue;
    out[dt.y].push({day:dt.d,month:dt.m,revenue:rev,invoice:inv,units:units,traffic:traffic,ftw:cat.ftw,app:cat.app,acc:cat.acc});
    if(dt.y===2026&&c.target>=0&&n(r[c.target])&&!targets.revenue)targets.revenue=n(r[c.target]);
   }
  });
 });
 Object.keys(out).forEach(function(y){out[y].sort(function(a,b){return a.month-b.month||a.day-b.day;});});
 return {rows:out,targets:targets};
}
function sum(rows){return rows.reduce(function(t,r){["revenue","invoice","units","traffic"].forEach(function(k){t[k]+=r[k];});return t;},{revenue:0,invoice:0,units:0,traffic:0});}
function derive(t){return {revenue:t.revenue,invoice:t.invoice,units:t.units,traffic:t.traffic,upt:t.invoice===null?null:(t.invoice?t.units/t.invoice:0),cr:t.invoice===null?null:(t.traffic?t.invoice/t.traffic*100:0),atv:t.invoice===null?null:(t.invoice?t.revenue/t.invoice:0),asp:t.units?t.revenue/t.units:0};}
function pct(a,b){return a?(b-a)/a*100:null;}
function disp(k,v){if(v===null||v===undefined)return "VERİ YOK";return ["revenue","atv","asp"].indexOf(k)>=0?money(v):k==="cr"?"%"+f(v,1):k==="upt"?f(v,2):f(v);}
function ch(p){return p===null?"VERİ YOK":(p>=0?"▲ +":"▼ ")+f(Math.abs(p),1)+"%";}
function cls(p){return p===null?"neutral":p>=0?"up":"down";}
function card(label,k,icon,a,b){var p=pct(a[k],b[k]);return '<article class="st-kpi"><div class="st-kpi-head"><i>'+icon+'</i><b>'+label+'</b></div><div class="st-year"><small>2025</small><strong>'+disp(k,a[k])+'</strong></div><div class="st-year"><small>2026</small><strong>'+disp(k,b[k])+'</strong></div><div class="st-change '+cls(p)+'">'+ch(p)+'</div></article>';}
function chart(a,b){
 var max=1;a.concat(b).forEach(function(r){max=Math.max(max,r.revenue);});var W=900,H=230,L=58,T=12,R=15,B=32,iw=W-L-R,ih=H-T-B,g="",labs="";
 for(var i=0;i<=4;i++){var y=T+ih-i*ih/4;g+='<line x1="'+L+'" y1="'+y+'" x2="'+(W-R)+'" y2="'+y+'" stroke="#333"/><text x="'+(L-8)+'" y="'+(y+4)+'" fill="#ddd" text-anchor="end" font-size="12">'+f(max*i/4/1000)+'K</text>';}
 for(var d=1;d<=31;d++)labs+='<text x="'+(L+(d-1)/30*iw)+'" y="'+(H-7)+'" fill="#ddd" text-anchor="middle" font-size="11">'+d+'</text>';
 function points(rows){return rows.map(function(r){return (L+(r.day-1)/30*iw)+","+(T+ih-r.revenue/max*ih);}).join(" ");}
 return '<svg viewBox="0 0 900 230" class="st-chart" role="img" aria-label="Günlük ciro 2025 2026 çizgi grafiği">'+g+labs+'<polyline points="'+points(a)+'" fill="none" stroke="#aaa" stroke-width="3"/><polyline points="'+points(b)+'" fill="none" stroke="#ed1c2e" stroke-width="3.5"/>'+a.map(function(r){return '<circle cx="'+(L+(r.day-1)/30*iw)+'" cy="'+(T+ih-r.revenue/max*ih)+'" r="3" fill="#aaa"/>';}).join("")+b.map(function(r){return '<circle cx="'+(L+(r.day-1)/30*iw)+'" cy="'+(T+ih-r.revenue/max*ih)+'" r="3.5" fill="#ed1c2e"/>';}).join("")+'</svg>';
}
function addStyles(){if($("stExactCss"))return;var s=document.createElement("style");s.id="stExactCss";s.textContent=String.raw`
#storeTrackingArea{max-width:1540px;margin:auto;padding:12px 14px 40px;color:#fff;font-family:Arial,sans-serif}#storeTrackingArea *{box-sizing:border-box}
.st-dashboard{padding:15px;border:1px solid #333;border-radius:17px;background:radial-gradient(ellipse at 50% 0,#252525,#080808 65%);overflow:hidden}
.st-top{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:5px 5px 16px;border-bottom:1px solid #333;margin-bottom:14px}.st-brand{display:flex;align-items:center;gap:15px}.st-logo{font-size:39px;font-weight:1000;font-style:italic;letter-spacing:-4px}.st-sep{height:55px;border-left:2px solid #eee}.st-brand h1{margin:0;font-size:clamp(22px,3vw,42px);font-weight:1000}.st-brand p{margin:8px 0 0;letter-spacing:5px;font-size:clamp(9px,1.4vw,16px);font-weight:800}.st-period{border:1px solid #d5001c;border-radius:10px;padding:13px 16px;white-space:nowrap;font-weight:800}
.st-kpis{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:9px}.st-kpi{min-width:0;padding:11px 8px 8px;border:1px solid #555;border-radius:13px;background:linear-gradient(145deg,#181818,#060606);text-align:center}.st-kpi-head{height:35px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:clamp(10px,.9vw,14px);white-space:nowrap}.st-kpi-head i{font-style:normal;font-size:20px}.st-year{display:flex;flex-direction:column;gap:3px;margin-top:8px}.st-year small{font-size:11px;color:#ddd}.st-year strong{font-size:clamp(12px,1.15vw,18px);white-space:nowrap}.st-change{padding:9px 2px;margin-top:11px;border-radius:8px;font-size:clamp(10px,1vw,16px);font-weight:1000;white-space:nowrap}.st-change.up{background:#079344;color:white}.st-change.down{background:#b20e1a;color:white}.st-change.neutral{background:#555;color:white}
.st-mid,.st-bottom{display:grid;grid-template-columns:2fr 1fr;gap:13px;margin-top:14px}.st-panel{min-width:0;padding:13px;border:1px solid #454545;border-radius:14px;background:linear-gradient(145deg,#121212,#070707)}.st-title{display:flex;align-items:center;gap:9px;margin:0 0 12px;font-size:clamp(15px,1.4vw,21px);font-weight:1000}.st-title i{font-style:normal;color:#ed1c2e;font-size:24px}.st-legend{margin-left:auto;font-size:12px;font-weight:500}.st-legend em{font-style:normal;margin-left:10px}.st-legend em:first-child:before{content:"● ";color:#aaa}.st-legend em:last-child:before{content:"● ";color:#ed1c2e}.st-chart{width:100%;height:auto;display:block}
.st-category-daily-wrap{max-height:360px;overflow:auto;border:1px solid #444;border-radius:9px}.st-category-daily{width:100%;min-width:470px;border-collapse:collapse;font-size:11px}.st-category-daily th{position:sticky;top:0;background:#292929;color:#fff;padding:9px 7px;text-align:left}.st-category-daily td{padding:8px 7px;border-bottom:1px solid #333;color:#eee;white-space:nowrap}.st-category-daily tr:nth-child(even){background:#171717}.st-category-daily td:last-child{font-weight:800;color:#f2f2f2}.st-cats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.st-cat{text-align:center;min-width:0}.st-cat h3{margin:4px 0 8px}.st-cat div{background:#191919;border-radius:6px;padding:10px 3px;margin-bottom:6px}.st-cat small{display:block;color:#ccc;font-size:10px}.st-cat b{display:block;margin-top:4px;font-size:clamp(11px,1.1vw,16px);white-space:nowrap}.st-targets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.st-target b{font-size:13px}.st-target p{font-size:12px;line-height:1.5}.st-barrow{display:flex;align-items:center;gap:8px}.st-bar{height:13px;background:#393939;border-radius:20px;overflow:hidden;flex:1}.st-bar span{display:block;height:100%;background:#d5001c}.st-bar span.ok{background:#08a64b}.st-barrow strong{white-space:nowrap}.st-leaders{display:grid;grid-template-columns:1fr 1fr;text-align:center}.st-leaders>div{padding:8px;border-right:1px solid #555}.st-leaders>div:last-child{border:0}.st-leaders small,.st-leaders b{display:block;margin:8px 0}.st-foot{display:flex;justify-content:space-between;gap:12px;margin-top:14px;padding-top:12px;border-top:1px solid #333;color:#bbb;font-size:11px}
@media(max-width:1050px){.st-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.st-mid,.st-bottom{grid-template-columns:1fr}}@media(max-width:600px){#storeTrackingArea{padding:8px}.st-dashboard{padding:8px}.st-top{align-items:flex-start;flex-direction:column}.st-logo{font-size:29px}.st-sep{height:42px}.st-brand h1{font-size:20px}.st-brand p{letter-spacing:2px}.st-period{padding:9px}.st-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.st-kpi{padding:9px 5px}.st-year strong{font-size:15px}.st-change{font-size:12px}.st-targets{grid-template-columns:1fr}.st-foot{flex-direction:column}.st-title{font-size:14px}.st-cats{gap:4px}.st-cat h3{font-size:12px}.st-cat b{font-size:11px}}
`;document.head.appendChild(s);}
function render(wb){
 addStyles();var data=parse(wb),all26=data.rows[2026],first=all26[0]||data.rows[2025][0];if(!first)throw Error("Excel sayfalarında günlük tarih satırı bulunamadı.");
 var month=first.month,entered=all26.filter(function(r){return r.month===month&&(r.revenue||r.invoice||r.units||r.traffic);}),last=entered.reduce(function(m,r){return Math.max(m,r.day);},0);
 var r25=data.rows[2025].filter(function(r){return r.month===month&&r.day<=last;}),r26=entered;
 var s25=sum(r25);var a=derive(s25),b=derive(sum(r26));
 var cards=[["CİRO","revenue","▤"],["FATURA","invoice","▧"],["ÜRÜN ADEDİ","units","▣"],["TRAFİK","traffic","♟"],["UPT","upt","↗"],["CR","cr","◎"],["ATV","atv","◆"],["ASP","asp","🛒"]].map(function(x){return card(x[0],x[1],x[2],a,b);}).join("");
 var cats=["FTW","APP","ACC"].map(function(c){var x=data.cats[c],p=pct(x[2025],x[2026]);return '<div class="st-cat"><h3>'+c+'</h3><div><small>2025</small><b>'+(x[2025]?money(x[2025]):"VERİ YOK")+'</b></div><div><small>2026</small><b>'+(x[2026]?money(x[2026]):"VERİ YOK")+'</b></div><div class="st-change '+cls(p)+'">'+ch(p)+'</div></div>';}).join("");
 var byDay25={},byDay26={};r25.forEach(function(r){byDay25[r.day]=r;});r26.forEach(function(r){byDay26[r.day]=r;});
 function catVal(v){return v===null||v===undefined?"VERİ YOK":money(v);}
 function catChange(x,y){return x===null||x===undefined||y===null||y===undefined||x===0?"—":ch(pct(x,y));}
 var catRows="";
 for(var day=1;day<=last;day++){
  var x=byDay25[day]||{},y=byDay26[day]||{};
  ["ftw","app","acc"].forEach(function(k){var v25=x[k],v26=y[k];catRows+='<tr><td>'+day+'</td><td>'+k.toUpperCase()+'</td><td>'+catVal(v25)+'</td><td>'+catVal(v26)+'</td><td>'+catChange(v25,v26)+'</td></tr>';});
 }
 var defs=[["CİRO","revenue","TL"]];
 var targets=defs.map(function(x){var goal=data.targets[x[1]]||0,actual=b[x[1]],p=goal?actual/goal*100:0;return '<div class="st-target"><b>'+x[0]+'</b><p>Hedef: '+(goal?f(goal)+' '+x[2]:"Excel hedefi bulunamadı")+'<br>Gerçekleşen: '+f(actual)+' '+x[2]+'</p><div class="st-barrow"><div class="st-bar"><span class="'+(p>=100?"ok":"")+'" style="width:'+Math.min(100,p)+'%"></span></div><strong>'+(goal?"%"+f(p,1):"—")+'</strong></div></div>';}).join("");
 var months=["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
 $("storeTrackingDashboard").innerHTML='<div class="st-dashboard"><header class="st-top"><div class="st-brand"><div class="st-logo">PUMA</div><div class="st-sep"></div><div><h1>MAĞAZA PERFORMANS ÖZETİ</h1><p>'+months[month].toLocaleUpperCase("tr-TR")+' 2025 – '+months[month].toLocaleUpperCase("tr-TR")+' 2026</p></div></div><div class="st-period">▦ &nbsp;01 – '+(last||31)+' '+months[month]+'</div></header><section class="st-kpis">'+cards+'</section><div class="st-mid"><section class="st-panel"><h2 class="st-title"><i>↗</i> GÜNLÜK CİRO KARŞILAŞTIRMASI <span class="st-legend"><em>2025</em><em>2026</em></span></h2>'+chart(r25,r26)+'</section><section class="st-panel"><h2 class="st-title"><i>▥</i> KATEGORİ KARŞILAŞTIRMASI · GÜNLÜK</h2><div class="st-category-daily-wrap"><table class="st-category-daily"><thead><tr><th>GÜN</th><th>KATEGORİ</th><th>2025</th><th>2026</th><th>DEĞİŞİM</th></tr></thead><tbody>'+catRows+'</tbody></table></div></section></div><div class="st-bottom"><section class="st-panel"><h2 class="st-title"><i>◎</i> HEDEF / GERÇEKLEŞEN</h2><div class="st-targets">'+targets+'</div></section><section class="st-panel"><h2 class="st-title"><i>🏆</i> MAĞAZA LİDERLERİ</h2><div class="st-leaders"><div>ATV ŞAMPİYONU<small>Personel verisi</small><b>Excel kaynağında yok</b></div><div>CR ŞAMPİYONU<small>Personel verisi</small><b>Excel kaynağında yok</b></div></div></section></div><footer class="st-foot"><b>FOREVER. FASTER.</b><span>ⓘ 2026 verileri girilen '+last+' gün için 2025’in aynı tarihleriyle karşılaştırılmıştır.</span></footer></div>';
}
window.renderStoreTracking=function(){var root=$("storeTrackingDashboard");if(!root)return;root.innerHTML='<p style="padding:20px;color:white">Excel verileri yükleniyor…</p>';load().then(render).catch(function(e){console.error(e);root.innerHTML='<div style="padding:20px;color:white;background:#300;border:1px solid #d5001c;border-radius:12px">Veriler yüklenemedi: '+String(e.message||e)+'</div>';});};
})();