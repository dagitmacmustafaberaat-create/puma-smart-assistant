let products = [];

// ======================================================
// SUPABASE AYARLARI
// ======================================================
const SUPABASE_URL = "https://zjxphwqcmmmbikgrbhyn.supabase.co";
const SUPABASE_KEY = "sb_publishable_OF_6Dt6vWB3Z0XlyvOxIog_evFp_M57";

// ======================================================
// SUPABASE ARAMA KAYDI
// ======================================================
async function saveSearchLog(
    searchType,
    productCode,
    productName,
    size,
    searchText
) {
    try {
        const response = await fetch(
            SUPABASE_URL + "/rest/v1/search_logs",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_KEY,
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    search_type: searchType,
                    product_code: productCode || null,
                    product_name: productName || null,
                    size: size || null,
                    search_text: searchText || null
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("SUPABASE HATASI:", response.status, errorText);
            return false;
        }

        console.log("✅ ARAMA SUPABASE'E KAYDEDİLDİ:", searchType, searchText);
        return true;
    } catch (error) {
        console.error("❌ SUPABASE BAĞLANTI HATASI:", error);
        return false;
    }
}

// ======================================================
// YARDIMCI FONKSİYONLAR
// ======================================================
function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function tryNextImage(imgElement) {
    imgElement.onerror = null;
    imgElement.parentElement.style.display = 'none';
}

// ======================================================
// VERİ ALANLARI
// ======================================================
function getBarkod(item) {
    return String(
        item["BARKOD"] ?? item["Barkod"] ?? item["barcode"] ?? item["BARCODE"] ?? item["barkod"] ?? ""
    ).trim();
}

function getStokKodu(item) {
    return String(
        item["PRODUCTCODE"] ?? item["PRODUCT_CODE"] ?? item["PRODUCT CODE"] ?? item["productCode"] ?? 
        item["product_code"] ?? item["urunKodu"] ?? item["URUN_KODU"] ?? item["Ürün kodu"] ?? 
        item["Ürün Kodu"] ?? item["STOK KODU"] ?? item["Stok Kodu"] ?? item["code"] ?? ""
    ).trim();
}

function getUrun(item) {
    return String(
        item["PRODUCTNAME"] ?? item["PRODUCT_NAME"] ?? item["PRODUCT NAME"] ?? item["productName"] ?? 
        item["Ürün Adı"] ?? item["Ürün adı"] ?? item["product_name"] ?? ""
    ).trim();
}

function getBeden(item) {
    return String(
        item["BEDEN NO"] ?? item["BEDEN_NO"] ?? item["Beden No"] ?? item["bedenNo"] ?? 
        item["BEDEN"] ?? item["Beden"] ?? item["size"] ?? ""
    ).trim();
}

function getStok(item) {
    const value = Number(
        item["STOK ADEDİ"] ?? item["STOK_ADEDI"] ?? item["Stok Adedi"] ?? item["stokAdedi"] ?? 
        item["STOK"] ?? item["Stok"] ?? item["stock"] ?? item["stok"] ?? 0
    );
    return Number.isFinite(value) ? value : 0;
}

function getCinsiyet(item) {
    return String(
        item["CİNSİYET"] ?? item["Cinsiyet"] ?? item["CINSIYET"] ?? item["gender"] ?? ""
    ).trim();
}

function getKategori(item) {
    return String(
        item["PUMA KATEGORİ"] ?? item["PUMA_KATEGORI"] ?? item["PUMA KATEGORI"] ?? 
        item["Kategori"] ?? item["KATEGORI"] ?? item["category"] ?? ""
    ).trim();
}

function getSezon(item) {
    return String(
        item["SEZON"] ?? item["Sezon"] ?? item["season"] ?? ""
    ).trim();
}

// ======================================================
// GÖRSEL
// ======================================================
function getGorsel(item) {
    let value =
        item["ÜRÜN RESMİ EXCEL"] ??
        item["URUN_RESIMI_EXCEL"] ??
        item["Ürün Görseli"] ??
        item["PRODUCT IMAGE"] ??
        item["image"] ??
        "";

    if (value === null || value === undefined) {
        return "";
    }

    let url = String(value).trim();
    const markdownMatch = url.match(/\((https?:\/\/[^)]+)\)/);

    if (markdownMatch) {
        url = markdownMatch[1];
    }

    url = url
        .replace(/^\[/, "")         .replace(/\]$/, "")
        .replace(/\\/g, "")
        .trim();

    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    return "";
}

function findImage(product) {
    if (
        product.gorsel &&
        (product.gorsel.startsWith("http://") || product.gorsel.startsWith("https://"))
    ) {
        return product.gorsel;
    }
    return "";
}

// ======================================================
// DATA.JSON YÜKLE
// ======================================================
async function loadProducts() {
    try {
        const response = await fetch("./data.json?v=" + Date.now(), {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("data.json yüklenemedi. HTTP: " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("data.json liste değil.");
        }

        products = data;

        console.log("====================================");
        console.log("PUMA SMART ASSISTANT");
        console.log("Toplam kayıt:", products.length);
        console.log("====================================");

        populateSizeFilter();
    } catch (error) {
        console.error("DATA.JSON HATASI:", error);

        const results = document.getElementById("results");

        if (results) {
            results.innerHTML =
                "<div class='notfound'>" +
                "❌ Stok verisi okunamadı.<br><br>" +
                escapeHTML(error.message) +
                "</div>";
        }
    }
}

// Sayfa yüklendiğinde verileri çek
document.addEventListener("DOMContentLoaded", function () {
    loadProducts();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            searchProducts(e.target.value);
        });
    }
});

// ======================================================
// ANA MENÜ
// ======================================================
function showStoreMenu() { showMainMenu(); }

function showMainMenu() {
    const mainMenu = document.getElementById("mainMenu");
    const productSearchArea = document.getElementById("productSearchArea");
    const sizeSearchArea = document.getElementById("sizeSearchArea");
    const educationArea = document.getElementById("educationArea");
    const results = document.getElementById("results");
    const sizeResults = document.getElementById("sizeResults");
    if (mainMenu) mainMenu.style.display = "flex";
    if (productSearchArea) productSearchArea.style.display = "none";
    if (sizeSearchArea) sizeSearchArea.style.display = "none";
    if (educationArea) educationArea.style.display = "none";
    if (results) results.innerHTML = "";
    if (sizeResults) sizeResults.innerHTML = "";
}

// ÜRÜN SORGULAMA
// ======================================================
function showProductSearch() {
    const mainMenu = document.getElementById("mainMenu");
    const productSearchArea = document.getElementById("productSearchArea");
    const sizeSearchArea = document.getElementById("sizeSearchArea");
    const educationArea = document.getElementById("educationArea");
    if (mainMenu) mainMenu.style.display = "none";
    if (productSearchArea) productSearchArea.style.display = "block";
    if (sizeSearchArea) sizeSearchArea.style.display = "none";
    if (educationArea) educationArea.style.display = "none";
    const input = document.getElementById("searchInput");
    if (input) {
        input.value = "";
        setTimeout(function () { input.focus(); }, 100);
    }
    const results = document.getElementById("results");
    if (results) results.innerHTML = "";
}

// ======================================================
// BEDEN SORGULAMA
// ======================================================
function showSizeSearch() {
    const mainMenu = document.getElementById("mainMenu");
    const productSearchArea = document.getElementById("productSearchArea");
    const sizeSearchArea = document.getElementById("sizeSearchArea");
    const educationArea = document.getElementById("educationArea");
    if (mainMenu) mainMenu.style.display = "none";
    if (productSearchArea) productSearchArea.style.display = "none";
    if (sizeSearchArea) sizeSearchArea.style.display = "block";
    if (educationArea) educationArea.style.display = "none";
    populateSizeFilter();
}

// ======================================================
// BEDENLERİ DOLDUR
// ======================================================
function populateSizeFilter() {
    const select = document.getElementById("sizeFilter");
    if (!select) return;

    const sizes = new Set();

    products.forEach(function (item) {
        const beden = getBeden(item);
        const stok = getStok(item);

        if (beden && stok > 0) {
            sizes.add(beden);
        }
    });

    const sortedSizes = Array.from(sizes).sort(function (a, b) {
        const aNum = parseFloat(String(a).replace(",", "."));
        const bNum = parseFloat(String(b).replace(",", "."));

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        }

        return String(a).localeCompare(String(b), "tr-TR");
    });

    select.innerHTML = '<option value="">Beden seçiniz</option>';

    sortedSizes.forEach(function (size) {
        const option = document.createElement("option");
        option.value = size;
        option.textContent = size;
        select.appendChild(option);
    });
}

// ======================================================
// BEDEN ARAMA
// ======================================================
function searchBySize(selectedSize) {
    const results = document.getElementById("sizeResults");
    if (!results) return;

    const size = String(selectedSize || "")
        .trim()
        .toLocaleLowerCase("tr-TR");

    if (!size) {
        results.innerHTML = "";
        return;
    }

    const filtered = products.filter(function (item) {
        const beden = getBeden(item).toLocaleLowerCase("tr-TR");
        return beden === size && getStok(item) > 0;
    });

    if (filtered.length === 0) {
        results.innerHTML = "<div class='notfound'>❌ Bu bedende stok bulunamadı.</div>";
        return;
    }

    const first = filtered[0];
    saveSearchLog(
        "size",
        getStokKodu(first),
        getUrun(first),
        selectedSize,
        selectedSize
    );

    renderProducts(filtered, results);
}

// ======================================================
// ARAMA NORMALİZASYONU
// ======================================================
function normalizeSearch(value) {
    return String(value || "").toLocaleLowerCase("tr-TR").trim().replace(/\s+/g, "");
}

function normalizeCode(value) {
    return String(value || "").toLocaleLowerCase("tr-TR").trim().replace(/[\s\-_.\/]/g, "");
}

// ======================================================
// ÜRÜN ARAMA
// ======================================================
let lastLoggedSearch = "";
let searchTimer = null;

function searchProducts(text) {
    const results = document.getElementById("results");
    if (!results) return;

    const search = String(text || "").trim().toLocaleLowerCase("tr-TR");

    if (!search) {
        results.innerHTML = "";
        return;
    }

    const searchNormal = normalizeSearch(search);
    const searchCode = normalizeCode(search);

    const filtered = products.filter(function (item) {
        if (getStok(item) <= 0) return false;

        const barkod = getBarkod(item).toLocaleLowerCase("tr-TR");
        const stokKodu = getStokKodu(item).toLocaleLowerCase("tr-TR");
        const urun = getUrun(item).toLocaleLowerCase("tr-TR");
        const beden = getBeden(item).toLocaleLowerCase("tr-TR");
        const cinsiyet = getCinsiyet(item).toLocaleLowerCase("tr-TR");
        const kategori = getKategori(item).toLocaleLowerCase("tr-TR");
        const sezon = getSezon(item).toLocaleLowerCase("tr-TR");

        const barkodNormal = normalizeCode(barkod);
        const stokKoduNormal = normalizeCode(stokKodu);
        const urunNormal = normalizeSearch(urun);
        const bedenNormal = normalizeSearch(beden);
        const cinsiyetNormal = normalizeSearch(cinsiyet);
        const kategoriNormal = normalizeSearch(kategori);
        const sezonNormal = normalizeSearch(sezon);

        return (
            barkod.includes(search) || barkodNormal.includes(searchCode) ||
            stokKodu.includes(search) || stokKoduNormal.includes(searchCode) ||
            urun.includes(search) || urunNormal.includes(searchNormal) ||
            beden.includes(search) || bedenNormal.includes(searchNormal) ||
            cinsiyet.includes(search) || cinsiyetNormal.includes(searchNormal) ||
            kategori.includes(search) || kategoriNormal.includes(searchNormal) ||
            sezon.includes(search) || sezonNormal.includes(searchNormal)
        );
    });

    if (filtered.length === 0) {
        results.innerHTML = "<div class='notfound'>❌ Ürün bulunamadı.</div>";
        return;
    }

    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
        if (lastLoggedSearch === search) return;
        lastLoggedSearch = search;

        const first = filtered[0];
        saveSearchLog(
            "product",
            getStokKodu(first),
            getUrun(first),
            null,
            text
        );
    }, 700);

    renderProducts(filtered, results);
}

// ======================================================
// ÜRÜNLERİ GRUPLA VE GÖSTER
// ======================================================
function renderProducts(list, container) {
    const grouped = {};

    list.forEach(function (item) {
        if (getStok(item) <= 0) return;

        const stokKodu = getStokKodu(item);
        const barkod = getBarkod(item);
        const urun = getUrun(item);
        const image = getGorsel(item);

        const key = stokKodu || barkod || urun;

        if (!grouped[key]) {
            grouped[key] = {
                urun: urun || "-",
                stokKodu: stokKodu || "-",
                barkod: barkod || "-",
                kategori: getKategori(item) || "-",
                cinsiyet: getCinsiyet(item) || "-",
                sezon: getSezon(item) || "-",
                gorsel: image || "",
                sizes: []
            };
        } else if (!grouped[key].gorsel && image) {
            grouped[key].gorsel = image;
        }

        grouped[key].sizes.push({
            beden: getBeden(item) || "-",
            stok: getStok(item)
        });
    });

    let html = "";

    Object.values(grouped).forEach(function (product) {
        const sizeMap = {};

        product.sizes.forEach(function (size) {
            const key = String(size.beden).trim().toLocaleLowerCase("tr-TR");
            if (!sizeMap[key]) {
                sizeMap[key] = { beden: size.beden, stok: 0 };
            }
            sizeMap[key].stok += Number(size.stok) || 0;
        });

        product.sizes = Object.values(sizeMap).filter(size => size.stok > 0);

        if (product.sizes.length === 0) return;

        product.sizes.sort(function (a, b) {
            const aNum = parseFloat(String(a.beden).replace(",", "."));
            const bNum = parseFloat(String(b.beden).replace(",", "."));

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            return String(a.beden).localeCompare(String(b.beden), "tr-TR");
        });

        let sizeHTML = "";
        product.sizes.forEach(function (size) {
            let stockClass = size.stok <= 2 ? "low-stock" : "";
            sizeHTML += `
                <div class="size-box ${stockClass}">
                    <span class="size">${escapeHTML(size.beden)}</span>
                    <span class="quantity">${size.stok}</span>
                </div>
            `;
        });

        const image = findImage(product);

        html += `
            <div class="product-card">
                ${image ? `
                <div class="product-image">
                    <img src="${escapeHTML(image)}" alt="${escapeHTML(product.urun)}" loading="lazy" referrerpolicy="no-referrer" onerror="tryNextImage(this);">
                </div>
                ` : ""}
                <div class="product-name">${escapeHTML(product.urun)}</div>
                <div><strong>Ürün Kodu:</strong> ${escapeHTML(product.stokKodu)}</div>
                <div><strong>Barkod:</strong> ${escapeHTML(product.barkod)}</div>
                <div><strong>Kategori:</strong> ${escapeHTML(product.kategori)}</div>
                <div><strong>Cinsiyet:</strong> ${escapeHTML(product.cinsiyet)}</div>
                <div><strong>Sezon:</strong> ${escapeHTML(product.sezon)}</div>
                <div class="size-title">BEDEN / STOK</div>
                <div class="sizes">${sizeHTML}</div>
            </div>
        `;
    });

    if (!html.trim()) {
        container.innerHTML = "<div class='notfound'>❌ Stokta ürün bulunamadı.</div>";
        return;
    }

    container.innerHTML = html;
}

// ======================================================
// EĞİTİM DÖKÜMANI AÇMA
// ======================================================
function openEducationPDF() {
    const pdfPath = 'egitim.pdf';
    window.open(pdfPath, '_blank');
}


/* ======================================================
   MAĞAZA PERFORMANS PANELİ
   Kaynak Excel'deki değerleri okur; hiçbir formülü değiştirmez.
   ====================================================== */
async function loadPerformanceDashboard() {
    const root = document.getElementById("performanceSections");
    if (!root) return;

    try {
        const response = await fetch("./performance-data.json?v=" + Date.now(), { cache: "no-store" });
        if (!response.ok) throw new Error("Performans verisi yüklenemedi.");
        const workbook = await response.json();
        const sheet = (workbook.sheets || [])[0];
        if (!sheet) throw new Error("Excel sayfası bulunamadı.");

        const cells = {};
        (sheet.rows || []).forEach(row => (row.cells || []).forEach(cell => { cells[cell.address] = cell; }));
        const get = address => cells[address] || null;
        const raw = address => { const c = get(address); return c ? c.value : null; };
        const safe = value => escapeHTML(value === null || value === undefined || value === "" ? "—" : value);
        const format = cell => {
            if (!cell || cell.value === null || cell.value === undefined || cell.value === "") return "—";
            const value = cell.value;
            if (typeof value === "string") return escapeHTML(value);
            const fmt = String(cell.number_format || "");
            if (fmt.includes("%")) {
                return new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 2 }).format(value);
            }
            if (fmt.includes("₺") || /TL/i.test(fmt)) {
                return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(value);
            }
            return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
        };
        const card = (label, valueCell, extraClass = "") => `
            <article class="metric-card ${extraClass}">
              <span class="metric-label">${safe(label)}</span>
              <strong class="metric-value">${format(valueCell)}</strong>
            </article>`;
        const section = (title, subtitle, cards, extraClass = "") => `
            <section class="performance-group ${extraClass}">
              <div class="performance-group-heading"><h3>${safe(title)}</h3></div>
              <div class="metric-card-grid">${cards.join("")}</div>
            </section>`;

        const targets = [
            ["Ciro", "C8"], ["UPT", "C9"], ["CR", "C10"], ["ASP", "C11"],
            ["Fatura", "C12"], ["Ürün Adedi", "C13"], ["Trafik", "C14"]
        ];
        const daily = [
            ["Ciro", "F8"], ["UPT", "F9"], ["CR", "F10"], ["ASP", "F11"],
            ["Fatura", "F12"], ["Ürün Adedi", "F13"], ["Trafik", "F14"]
        ];
        const kpiRows = [
            ["Ciro", 17], ["UPT", 18], ["CR", 19], ["ASP", 20],
            ["Fatura", 21], ["Ürün Adedi", 22], ["Trafik", 23]
        ];
        const kpiCards = kpiRows.map(([label, row]) => `
            <article class="kpi-row-card">
              <h4>${safe(label)}</h4>
              <div class="kpi-values">
                <div><span>Gerçekleşmesi Gereken</span><strong>${format(get("C" + row))}</strong></div>
                <div><span>Gerçekleşen</span><strong>${format(get("D" + row))}</strong></div>
                <div><span>Fark</span><strong>${format(get("E" + row))}</strong></div>
                <div><span>Sapma</span><strong>${format(get("F" + row))}</strong></div>
              </div>
            </article>`);

        const categoryCards = [
            {name: raw("H4"),  y25: "I5", y26: "J5", growth: "I6"},
            {name: raw("H7"),  y25: "I8", y26: "J8", growth: "I9"},
            {name: raw("H10"), y25: "I11", y26: "J11", growth: "I12"}
        ].map(item => `
            <article class="comparison-card">
              <h4>${safe(item.name)}</h4>
              <div class="comparison-values">
                <div><span>2025 Ciro</span><strong>${format(get(item.y25))}</strong></div>
                <div><span>2026 Ciro</span><strong>${format(get(item.y26))}</strong></div>
                <div><span>Büyüme</span><strong>${format(get(item.growth))}</strong></div>
              </div>
            </article>`);

        const genderCards = [15,16,17,18,19].map(row => {
            const name = raw("H" + row);
            if (name === null || name === undefined) return "";
            return `
              <article class="comparison-card">
                <h4>${safe(name)}</h4>
                <div class="comparison-values">
                  <div><span>2025</span><strong>${format(get("I" + row))}</strong></div>
                  <div><span>2026</span><strong>${format(get("J" + row))}</strong></div>
                  <div><span>Büyüme</span><strong>${format(get("K" + row))}</strong></div>
                </div>
              </article>`;
        }).filter(Boolean);

        const stockCards = [
            {name: raw("H24"), old: "I24", current: "J24"},
            {name: raw("H25"), old: "I25", current: "J25"},
            {name: raw("H26"), old: "I26", current: "J26"},
            {name: raw("H27"), old: "I27", current: "J27"}
        ].filter(item => item.name !== null && item.name !== undefined).map(item => `
            <article class="comparison-card">
              <h4>${safe(item.name)}</h4>
              <div class="comparison-values">
                <div><span>2025</span><strong>${format(get(item.old))}</strong></div>
                <div><span>2026</span><strong>${format(get(item.current))}</strong></div>
              </div>
            </article>`);

        const groups = [];
        groups.push(section("Dönem Bilgisi", "Excel tablosundaki dönem bilgileri", [
            card("Ay Gün Sayısı", get("C4")),
            card("Geçen Gün Sayısı", get("C5"))
        ], "period-group"));
        groups.push(section("Ekim 2026 Hedefleri", "Tablodaki aylık hedef değerleri", targets.map(([label, address]) => card(label, get(address))), "targets-group"));
        groups.push(section("Günlük Yapılması Gerekenler", "Tablodaki günlük değerler; yeniden hesaplanmaz", daily.map(([label, address]) => card(label, get(address))), "daily-group"));
        groups.push(section("Bugüne Kadar: Hedef ve Gerçekleşen", "Excel tablosundaki KPI, fark ve sapma değerleri", kpiCards, "kpi-group"));
        groups.push(section("Tahmini Kapanış", "Tablodaki mevcut tahmin ve HGO değeri", [
            card("Tahmini Kapanış Cirosu", get("C25"), "metric-card-featured"),
            card(String(raw("E25") || "HGO"), get("F25"), "metric-card-featured")
        ], "forecast-group"));
        groups.push(section("Kategori Bazlı Ciro Karşılaştırması", "Tabloda bulunan 2025 / 2026 ve büyüme değerleri", categoryCards, "comparison-group"));
        groups.push(section("Cinsiyet Bazlı Karşılaştırma", "Tablodaki değerler olduğu gibi gösterilir", genderCards, "comparison-group"));
        groups.push(section("Kategori Bazlı Stok Karşılaştırması", "2025 ve 2026 değerleri", stockCards, "comparison-group"));

        root.innerHTML = groups.join("");
    } catch (error) {
        console.error("MAĞAZA PERFORMANS VERİSİ HATASI:", error);
        root.innerHTML = '<div class="performance-loading">Mağaza verisi şu anda okunamadı. Excel verisi ve otomatik güncelleme kontrol edilmeli.</div>';
    }
}
document.addEventListener("DOMContentLoaded", loadPerformanceDashboard);


// SOL ÜST HIZLI MODÜL MENÜSÜ
function toggleModuleMenu() {
    const menu = document.getElementById("moduleQuickMenu");
    const toggle = document.getElementById("moduleMenuToggle");
    if (!menu || !toggle) return;
    const willOpen = menu.hidden;
    menu.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
    toggle.setAttribute("aria-label", willOpen ? "Modül menüsünü kapat" : "Modül menüsünü aç");
}
function chooseModule(openModule) {
    const menu = document.getElementById("moduleQuickMenu");
    const toggle = document.getElementById("moduleMenuToggle");
    if (menu) menu.hidden = true;
    if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Modül menüsünü aç");
    }
    if (typeof openModule === "function") openModule();
    window.scrollTo({ top: 0, behavior: "smooth" });
}
document.addEventListener("click", function(event) {
    const menu = document.getElementById("moduleQuickMenu");
    const toggle = document.getElementById("moduleMenuToggle");
    if (!menu || !toggle || menu.hidden) return;
    if (!menu.contains(event.target) && !toggle.contains(event.target)) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Modül menüsünü aç");
    }
});
