(function () {
  const FILE_URL = "https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/%C3%87ALI%C5%9EMA%20PROGRAMI%20YEN%C4%B0%20NES%C4%B0L.xlsx";
  const DAYS = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
  let views = [];
  let active = 0;
  const norm = value => String(value == null ? "" : value).toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/[^a-z0-9]/g,"");
  const escapeHTML = value => String(value == null ? "" : value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  function dayName(value) {
    const n = norm(value);
    const aliases = {pzt:"Pazartesi",pazartesi:"Pazartesi",sal:"Salı",sali:"Salı",carsamba:"Çarşamba",car:"Çarşamba",persembe:"Perşembe",per:"Perşembe",cuma:"Cuma",cum:"Cumartesi",cumartesi:"Cumartesi",cts:"Cumartesi",pazar:"Pazar",paz:"Pazar",sun:"Pazar"};
    return aliases[n] || DAYS.find(day => norm(day) === n) || null;
  }
  function rowHasDay(row) { return row.some(cell => !!dayName(cell)); }
  function makeTable(rows) {
    if (!rows || !rows.length) return '<p class="shift-program-empty">Bu gün için görüntülenecek satır bulunamadı.</p>';
    return '<div class="shift-table-scroll"><table class="shift-data-table"><tbody>' + rows.map((row,ri) => {
      const cells = row.map(cell => ri === 0 ? '<th scope="col">'+escapeHTML(cell)+'</th>' : '<td>'+escapeHTML(cell)+'</td>').join("");
      return '<tr>'+cells+'</tr>';
    }).join("") + '</tbody></table></div>';
  }
  function setViewsFromSheet(sheetName, rows) {
    const headerLimit = Math.min(rows.length, 18);
    let dayHeader = -1, dayCols = [];
    for (let r=0;r<headerLimit;r++) {
      const found = [];
      (rows[r] || []).forEach((cell,c) => { const d=dayName(cell); if(d) found.push({day:d,col:c}); });
      if (found.length >= 2 && found.length > dayCols.length) { dayHeader=r; dayCols=found; }
    }
    if (dayHeader >= 0) {
      const unique = dayCols.filter((item,i,arr)=>arr.findIndex(x=>x.day===item.day)===i);
      unique.forEach((item,i) => {
        const nextCol = (unique[i+1] && unique[i+1].col > item.col) ? unique[i+1].col : Math.max(...rows.map(r=>r.length),item.col+1);
        const commonCols = Array.from({length:item.col},(_,c)=>c);
        const daySpecificCols = Array.from({length:Math.max(1,nextCol-item.col)},(_,c)=>item.col+c);
        const cols = [...commonCols,...daySpecificCols];
        const selected = rows.slice(0,dayHeader).map(row=>cols.map(c=>row[c] == null ? "" : row[c]));
        selected.push(cols.map(c=>rows[dayHeader][c] == null ? "" : rows[dayHeader][c]));
        rows.slice(dayHeader+1).forEach(row=>selected.push(cols.map(c=>row[c] == null ? "" : row[c])));
        views.push({label:item.day,rows:selected});
      });
      return;
    }
    const rowDayIndex = rows.findIndex((row,i)=>i<18 && row.some(cell=>dayName(cell)));
    if (rowDayIndex >= 0 && rows[rowDayIndex].some(cell=>dayName(cell))) {
      const found = rows[rowDayIndex].map((cell,col)=>({day:dayName(cell),col})).filter(x=>x.day);
      if(found.length >= 2) return;
    }
    views.push({label:sheetName || "Çalışma Programı",rows});
  }
  function render() {
    const tabs=document.getElementById("shiftProgramDays"), table=document.getElementById("shiftProgramTable"), status=document.getElementById("shiftProgramStatus");
    if(!tabs||!table||!views.length)return;
    tabs.innerHTML=views.map((v,i)=>'<button type="button" class="shift-day-button '+(i===active?'active':'')+'" aria-pressed="'+(i===active)+'" onclick="selectShiftProgramDay('+i+')">'+escapeHTML(v.label)+'</button>').join("");
    table.innerHTML=makeTable(views[active].rows);
    if(status) status.textContent=views.length>1 ? views.length+" günlük görünüm hazır • "+views[active].label : "Excel programı görüntüleniyor";
  }
  window.selectShiftProgramDay = function(index) { if(index<0||index>=views.length)return; active=index; render(); };
  window.showShiftProgram = function() {
    ["mainMenu","productSearchArea","sizeSearchArea","educationArea","dailyTasksArea","vmStandardsArea","sdKarneArea"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="none";});
    const area=document.getElementById("shiftProgramArea"); if(area)area.style.display="block";
    if(!views.length) load();
    else render();
    window.scrollTo({top:0,behavior:"smooth"});
  };
  window.closeShiftProgram = function() {
    const area=document.getElementById("shiftProgramArea"); if(area)area.style.display="none";
    if(typeof showMainMenu==="function")showMainMenu();
  };
  async function load() {
    const status=document.getElementById("shiftProgramStatus");
    try {
      if(!window.XLSX) throw new Error("Excel görüntüleyici yüklenemedi.");
      const response=await fetch(FILE_URL+"?v="+Date.now(),{cache:"no-store"});
      if(!response.ok)throw new Error("Excel dosyası indirilemedi.");
      const bytes=await response.arrayBuffer();
      const workbook=XLSX.read(bytes,{type:"array",cellDates:true});
      workbook.SheetNames.forEach(name=>{
        const rows=XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:"",raw:false});
        if(rows.length)setViewsFromSheet(name,rows);
      });
      if(!views.length)throw new Error("Excel dosyasında görüntülenecek veri bulunamadı.");
      render();
    } catch(error) {
      console.error("Çalışma programı yüklenemedi:",error);
      if(status)status.textContent="Çalışma programı yüklenemedi. İnternet bağlantısını kontrol edin veya orijinal Excel dosyasını GitHub bağlantısından açın.";
      const table=document.getElementById("shiftProgramTable");
      if(table)table.innerHTML='<p class="shift-program-empty">Program verileri şu anda alınamadı.</p>';
    }
  }
})();
