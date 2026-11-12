const TRAINING_LIBRARY = [
  { icon: "🧭", title: "VM Kuralları", file: "vmkuralları.docx", group: "VM / SATIŞ" },
  { icon: "🗣️", title: "Satış Teknikleri", file: "satısteknikleri.pptx", group: "VM / SATIŞ" },
  { icon: "👟", title: "Tekstil ve Ayakkabı Teknolojileri", file: "egitim.pdf", group: "TEKNOLOJİ" },
  { icon: "🧮", title: "Perakende Matematiği", file: "perakendematematigi.pdf", group: "UYGULAMA" },
  { icon: "🤝", title: "BACK TO BE NICE", file: "BACK TO BE NICE.pdf", group: "UYGULAMA" }
];

const NOVEMBER_TRAINING = {
  "2026-11-10": { vmSales: ["Satış Teknikleri — E: İhtiyaç belirle, açık uçlu sorular ve aktif dinleme"], technology: ["Ayakkabı Teknolojileri — PROFOAM"], practice: ["Üç açık uçlu soru sor; ihtiyacı özetleyip ürün öner."] },
  "2026-11-11": { vmSales: ["VM — Ayakkabı duvarı ve numara düzeni"], technology: ["Tekstil Teknolojileri — PWRWarm / POWERWARM"], practice: ["Ayakkabı duvarını kontrol et; bir tekstil ürünü tanıt."] },
  "2026-11-12": { vmSales: ["Satış Teknikleri — N: İhtiyaca cevap ver, özellik-avantaj-fayda (FAB)"], technology: ["Ayakkabı Teknolojileri — PUMAGRIP"], practice: ["Bir ayakkabıyı özellik, avantaj ve fayda ile anlat."] },
  "2026-11-13": { vmSales: ["VM — Masa, katlama ve ürün sunumu"], technology: ["Tekstil Teknolojileri — WATERPROOF"], practice: ["Bir masada katlama ve ürün sunumu uygulaması yap."] },
  "2026-11-14": { vmSales: ["Satış Teknikleri — I: Ek ürün sun, 3 kutu ve 3+1 kombin"], technology: ["Ayakkabı Teknolojileri — RUNGUIDE"], practice: ["Üst, alt, ayakkabı ve aksesuarla 3+1 kombin hazırla."] },
  "2026-11-15": { vmSales: ["VM — Haftalık VM kontrolü ve fotoğraf standardı"], technology: ["Tekstil Teknolojileri — LYCRA®"], practice: ["Reyon kontrolü yap; aynı açıdan önce/sonra fotoğraf çek."] },
  "2026-11-16": { vmSales: ["VM — Manken kullanımı ve sezon kombinleri"], technology: ["Ayakkabı Teknolojileri — NITRO"], practice: ["Manken kombini hazırla; ayakkabı seçimini açıkla."] },
  "2026-11-17": { vmSales: ["Satış Teknikleri — C: Satışı sonuçlandır, itirazlarda 3A"], technology: ["Tekstil Teknolojileri — Kumaş yapısı ve bakım etiketleri"], practice: ["İtirazı sor, anlayışla karşıla, tavsiye ver; satışı kapat."] },
  "2026-11-18": { vmSales: ["VM — Stok ve satışa göre ürün yerleşimi"], technology: ["Ayakkabı Teknolojileri — RS"], practice: ["Stoklu bir ürünün yerleşimini değerlendir ve düzenle."] },
  "2026-11-19": { vmSales: ["Satış Teknikleri — E: Beklentileri aş, bakım bilgisi ve uğurlama"], technology: ["Ayakkabı Teknolojileri — evoKNIT"], practice: ["Bakım bilgisini paylaş; teşekkür edip tekrar davet et."] },
  "2026-11-20": { vmSales: ["VM — Fiyat etiketi ve kampanya görselleri"], technology: ["Tekstil Teknolojileri — DryCELL ve StormCELL karşılaştırması"], practice: ["Etiket ve görsel kontrolü yap; iki ürünü karşılaştır."] },
  "2026-11-21": { vmSales: ["Satış Teknikleri — BENICE: Alternatif model ve beden sunma"], technology: ["Ayakkabı Teknolojileri — Futbol ayakkabısı kullanım alanları"], practice: ["Bulunmayan model veya bedene uygun alternatif sun."] },
  "2026-11-22": { vmSales: ["VM — Haftalık VM kontrolü ve önce/sonra değerlendirmesi"], technology: ["Tekstil Teknolojileri — Tekstil teknolojilerini faydaya çevirme"], practice: ["Reyonu önce/sonra karşılaştır; bir ürünün faydasını anlat."] },
  "2026-11-23": { vmSales: ["VM — Kasa önü ve tamamlayıcı ürün yerleşimi"], technology: ["Ayakkabı Teknolojileri — SOFTRIDE ve PROFOAM karşılaştırması"], practice: ["Tamamlayıcı ürün alanını düzenle; iki ayakkabıyı tanıt."] },
  "2026-11-24": { vmSales: ["Satış Teknikleri — BENICE: UPT ve ATV için tamamlayıcı satış"], technology: ["Tekstil Teknolojileri — PWRWarm ve WATERPROOF kullanım senaryoları"], practice: ["Bir ana ürüne iki tamamlayıcı öner; faydalarını açıkla."] },
  "2026-11-25": { vmSales: ["VM — Teşhirde kategori ve koleksiyon bütünlüğü"], technology: ["Ayakkabı Teknolojileri — NITRO ve RS genel tekrar"], practice: ["Bir teşhiri kontrol et; ayakkabı seçeneklerini anlat."] },
  "2026-11-26": { vmSales: ["Satış Teknikleri — BENICE: Karşılama, ihtiyaç belirleme ve FAB tekrarı"], technology: ["Tekstil Teknolojileri — DryCELL ve LYCRA® kullanım senaryoları"], practice: ["Karşılama, ihtiyaç analizi ve FAB rol canlandırması yap."] },
  "2026-11-27": { vmSales: ["VM — Yoğun günlerde reyon düzeni ve ürün devamlılığı"], technology: ["Ayakkabı Teknolojileri — PUMAGRIP ve RUNGUIDE tekrarı"], practice: ["Eksik teşhir ve bedenleri kontrol et; reyonu tamamla."] },
  "2026-11-28": { vmSales: ["Satış Teknikleri — BENICE: Ek ürün, itiraz yönetimi ve kapanış tekrarı"], technology: ["Tekstil Teknolojileri — Kumaş ve bakım bilgisi uygulaması"], practice: ["Ek ürün, itiraz ve kapanış içeren satış senaryosu uygula."] },
  "2026-11-29": { vmSales: ["VM — Aylık VM uygulama değerlendirmesi"], technology: ["Tekstil Teknolojileri — Tekstil teknolojileri bilgi kontrolü"], practice: ["Ayın VM uygulamalarını değerlendir; üç ürün tanıt."] },
  "2026-11-30": { vmSales: ["Satış Teknikleri — BENICE: 6 adım ve ay sonu değerlendirmesi"], technology: ["Ayakkabı Teknolojileri — Ayakkabı teknolojileri bilgi kontrolü"], practice: ["Altı adımlı satış canlandırması yap; gelişim alanını belir."] },
  "2026-11-06": { vmSales: ["Satış Teknikleri — BENICE: Hizmet misyonu ve 6 adım"], technology: ["Tekstil Teknolojileri — DryCELL"], practice: ["BENICE adımlarını sırala; bir üründe fayda anlatımı yap."] },
  "2026-11-07": { vmSales: ["Satış Teknikleri — B: İletişim kur, karşılama ve beden dili"], technology: ["Ayakkabı Teknolojileri — TPU"], practice: ["İki farklı müşteri için karşılama rol canlandırması yap."] },
  "2026-11-08": { vmSales: ["VM — İlk izlenim, mağaza düzeni ve temizlik"], technology: ["Ayakkabı Teknolojileri — SOFTRIDE"], practice: ["Mağaza girişini kontrol et; bir ayakkabıyı tanıt."] },
  "2026-11-09": { vmSales: ["VM — Ürün gruplama ve renk bütünlüğü"], technology: ["Tekstil Teknolojileri — StormCELL"], practice: ["Bir reyonu renk ve kategoriye göre düzenle."] }
};

function showEducationCenter() {
  ["productSearchArea", "sizeSearchArea", "dailyTasksArea", "vmStandardsArea"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const area = document.getElementById("educationArea");
  const menu = document.getElementById("mainMenu");
  if (menu) menu.style.display = "none";
  if (area) area.style.display = "block";
  renderTrainingLibrary();
  renderEducationDateFilter();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openTrainingResource(file) {
  const paths = {
    "vmkuralları.docx": "vmkurallar%C4%B1.docx",
    "satısteknikleri.pptx": "sat%C4%B1steknikleri.pptx",
    "egitim.pdf": "egitim.pdf",
    "perakendematematigi.pdf": "perakendematematigi.pdf",
    "BACK TO BE NICE.pdf": "BACK%20TO%20BE%20NICE.pdf"
  };
  const path = paths[file];
  if (!path) return;

  const extension = file.split(".").pop().toLowerCase();
  const fileUrl = new URL("./" + path, window.location.href).href;
  const frame = document.getElementById("trainingDocumentFrame");
  const modal = document.getElementById("trainingDocumentModal");
  const title = document.getElementById("trainingDocumentTitle");
  if (!frame || !modal || !title) return;

  title.textContent = file.replace(/\\.(pdf|docx|pptx)$/i, "");
  if (extension === "pdf") {
    frame.src = fileUrl + "#toolbar=1&navpanes=0&view=FitH";
  } else {
    const officeUrl = "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(fileUrl);
    frame.src = officeUrl;
  }
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("training-document-open");
}

function closeTrainingDocument() {
  const modal = document.getElementById("trainingDocumentModal");
  const frame = document.getElementById("trainingDocumentFrame");
  if (modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }
  if (frame) frame.src = "about:blank";
  document.body.classList.remove("training-document-open");
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeTrainingDocument();
});

function renderTrainingLibrary() {
  const target = document.getElementById("trainingLibrary");
  if (!target) return;
  target.innerHTML = TRAINING_LIBRARY.map(function (item) {
    return '<button type="button" class="training-resource" onclick="openTrainingResource(\'' +
      item.file.replace(/'/g, "\\'") + '\')"><span class="training-resource-sticker" aria-hidden="true">' +
      item.icon + '</span><span class="training-resource-copy"><small>' + item.group +
      '</small><strong>' + item.title + '</strong></span><span class="training-resource-arrow" aria-hidden="true">↗</span></button>';
  }).join("");
}

function renderEducationDateFilter() {
  const select = document.getElementById("educationDateFilter");
  const result = document.getElementById("selectedDayTraining");
  if (!select) return;
  const dates = Object.keys(NOVEMBER_TRAINING).sort();
  select.innerHTML = '<option value="">Tarih seçiniz</option>' + dates.map(function (date) {
    const parts = date.split("-");
    const weekday = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toLocaleDateString("tr-TR", { weekday: "long" });
    const label = parts[2] + "." + parts[1] + "." + parts[0] + " • " + weekday.charAt(0).toLocaleUpperCase("tr-TR") + weekday.slice(1);
    return '<option value="' + date + '">' + label + '</option>';
  }).join("");
  select.value = "";
  if (result) result.innerHTML = '<div class="education-select-prompt">Günlük eğitim konularını görüntülemek için önce bir tarih seç.</div>';
}

function renderSelectedTrainingDay(date) {
  const target = document.getElementById("selectedDayTraining");
  if (!target) return;
  const data = NOVEMBER_TRAINING[date];
  if (!data) {
    target.innerHTML = '<div class="education-select-prompt">Günlük eğitim konularını görüntülemek için önce bir tarih seç.</div>';
    return;
  }
  const parts = date.split("-");
  const weekday = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toLocaleDateString("tr-TR", { weekday: "long" });
  const dayLabel = weekday.charAt(0).toLocaleUpperCase("tr-TR") + weekday.slice(1);
  const sections = [
    { icon: "🧭", title: "VM VE SATIŞ TEKNİKLERİ", items: data.vmSales },
    { icon: "👟", title: "TEKSTİL VE AYAKKABI TEKNOLOJİLERİ", items: data.technology },
    { icon: "🎯", title: "UYGULAMA", items: data.practice }
  ];
  target.innerHTML = '<header class="selected-training-heading"><span>' + parts[2] + '.' + parts[1] + '.' + parts[0] + ' • ' + dayLabel + '</span><h2>GÜNLÜK EĞİTİM İÇERİĞİ</h2></header>' +
    sections.map(function (section) {
      if (!section.items || !section.items.length) return "";
      return '<section class="selected-training-section"><h3><span>' + section.icon + '</span>' + section.title + '</h3>' +
        section.items.map(function (item) { return '<div class="selected-training-topic">' + item + '</div>'; }).join("") +
        '</section>';
    }).join("");
}

function closeEducationCenter() {
  const area = document.getElementById("educationArea");
  if (area) area.style.display = "none";
  showMainMenu();
}


window.BUYAKA_TRAINING_DATA = { library: TRAINING_LIBRARY, calendar: NOVEMBER_TRAINING };
