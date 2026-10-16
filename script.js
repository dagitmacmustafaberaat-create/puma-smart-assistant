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
        populateProductFilters();
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
    const dailyTasksArea = document.getElementById("dailyTasksArea");
    const vmStandardsArea = document.getElementById("vmStandardsArea");
    const results = document.getElementById("results");
    const sizeResults = document.getElementById("sizeResults");
    if (mainMenu) mainMenu.style.display = "flex";
    if (productSearchArea) productSearchArea.style.display = "none";
    if (sizeSearchArea) sizeSearchArea.style.display = "none";
    if (educationArea) educationArea.style.display = "none";
    if (dailyTasksArea) dailyTasksArea.style.display = "none";
    if (vmStandardsArea) vmStandardsArea.style.display = "none";
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
    const dailyTasksArea = document.getElementById("dailyTasksArea");
    const vmStandardsArea = document.getElementById("vmStandardsArea");
    if (mainMenu) mainMenu.style.display = "none";
    if (dailyTasksArea) dailyTasksArea.style.display = "none";
    if (vmStandardsArea) vmStandardsArea.style.display = "none";
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
    const dailyTasksArea = document.getElementById("dailyTasksArea");
    const vmStandardsArea = document.getElementById("vmStandardsArea");
    if (mainMenu) mainMenu.style.display = "none";
    if (dailyTasksArea) dailyTasksArea.style.display = "none";
    if (vmStandardsArea) vmStandardsArea.style.display = "none";
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

function populateProductFilters() {
    const categorySelect = document.getElementById("productCategoryFilter");
    const sizeSelect = document.getElementById("productSizeFilter");
    if (categorySelect) {
        const selected = categorySelect.value;
        const categories = [...new Set(products.filter(item => getStok(item) > 0).map(getKategori).filter(Boolean))].sort((a,b) => a.localeCompare(b,"tr-TR"));
        categorySelect.innerHTML = '<option value="">Tüm kategoriler</option>' + categories.map(v => '<option value="' + escapeHTML(v) + '">' + escapeHTML(v) + '</option>').join("");
        if (categories.includes(selected)) categorySelect.value = selected;
    }
    if (sizeSelect) {
        const selected = sizeSelect.value;
        const sizes = [...new Set(products.filter(item => getStok(item) > 0).map(getBeden).filter(Boolean))].sort((a,b) => {
            const an=parseFloat(String(a).replace(",",".")), bn=parseFloat(String(b).replace(",","."));
            if (!Number.isNaN(an) && !Number.isNaN(bn)) return an-bn;
            return String(a).localeCompare(String(b),"tr-TR");
        });
        sizeSelect.innerHTML = '<option value="">Tüm bedenler</option>' + sizes.map(v => '<option value="' + escapeHTML(v) + '">' + escapeHTML(v) + '</option>').join("");
        if (sizes.includes(selected)) sizeSelect.value = selected;
    }
}
function searchProducts(text) {
    const results = document.getElementById("results");
    if (!results) return;
    const search = String(text || "").trim().toLocaleLowerCase("tr-TR");
    const selectedCategory = document.getElementById("productCategoryFilter")?.value || "";
    const selectedSize = (document.getElementById("productSizeFilter")?.value || "").trim().toLocaleLowerCase("tr-TR");
    if (!search && !selectedCategory && !selectedSize) {
        results.innerHTML = "";
        return;
    }

    const searchNormal = normalizeSearch(search);
    const searchCode = normalizeCode(search);

    const filtered = products.filter(function (item) {
        if (getStok(item) <= 0) return false;
        if (selectedCategory && getKategori(item) !== selectedCategory) return false;
        if (selectedSize && getBeden(item).trim().toLocaleLowerCase("tr-TR") !== selectedSize) return false;
        if (!search) return true;
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

    if (search) {
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
    }
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
        renderStoreActionSummary(cells);
        organizeStoreStatusTabs();
    } catch (error) {
        console.error("MAĞAZA PERFORMANS VERİSİ HATASI:", error);
        root.innerHTML = '<div class="performance-loading">Mağaza verisi şu anda okunamadı. Excel verisi ve otomatik güncelleme kontrol edilmeli.</div>';
    }
}

function renderStoreActionSummary(cells) {
    const root = document.getElementById("storeActionSummary");
    if (!root) return;
    const getValue = address => {
        const cell = cells[address];
        if (!cell || cell.value === null || cell.value === undefined || cell.value === "") return null;
        const value = Number(cell.value);
        return Number.isFinite(value) ? value : null;
    };
    const definitions = [
        {name:"Ciro", target:"C17", actual:"D17", gap:"F17", action:"Ciro açığını kapatmak için yüksek potansiyelli ürünlere, müşteri ihtiyaç analizine ve satış fırsatlarına odaklan."},
        {name:"UPT", target:"C18", actual:"D18", gap:"F18", action:"Tamamlayıcı ürün önerilerini artır; ana ürünle uyumlu ikinci ürün fırsatlarını her müşteride değerlendir."},
        {name:"CR", target:"C19", actual:"D19", gap:"F19", action:"Müşteri karşılama, ihtiyaç analizi ve deneme sürecini güçlendirerek dönüşüm fırsatlarını artır."},
        {name:"ASP", target:"C20", actual:"D20", gap:"F20", action:"Ürün faydalarını doğru anlat; ihtiyaca uygun daha yüksek değerli alternatifleri karşılaştırmalı sun."},
        {name:"Fatura", target:"C21", actual:"D21", gap:"F21", action:"Müşteri trafiğini satışa dönüştürmek için aktif karşılama ve satış takibini güçlendir."},
        {name:"Ürün adedi", target:"C22", actual:"D22", gap:"F22", action:"Birlikte kullanım ve tamamlayıcı ürün önerileriyle ürün adedini artır."},
        {name:"Trafik", target:"C23", actual:"D23", gap:"F23", action:"Mağaza içi karşılama ve dönüşüm hazırlığını güçlendir; trafik verisi tek başına müşteri davranışının nedenini göstermez."}
    ];
    const fmtNumber = (n, digits=1) => new Intl.NumberFormat("tr-TR", {maximumFractionDigits:digits}).format(n);
    const fmtPercent = n => new Intl.NumberFormat("tr-TR", {style:"percent",maximumFractionDigits:1}).format(n);
    const insights = [];
    definitions.forEach(item => {
        const target = getValue(item.target);
        const actual = getValue(item.actual);
        const gap = getValue(item.gap);
        if (target === null || actual === null || target <= 0) return;
        const ratio = actual / target;
        const shortfall = gap !== null ? gap : ratio - 1;
        if (Math.abs(shortfall) < 0.02) {
            insights.push({type:"neutral",title:"🎯 "+item.name+" hedefe yakın",text:item.name+" gerçekleşmesi gereken seviyeye yakın. Mevcut ritmi koru ve veriyi takip et.",detail:"Gerçekleşen "+fmtNumber(actual,2)+" · Beklenen "+fmtNumber(target,2)});
        } else if (shortfall < 0) {
            insights.push({type:"warning",title:"⚠️ "+item.name+" hedefin gerisinde",text:item.action,detail:"Gerçekleşen "+fmtNumber(actual,2)+" · Beklenen "+fmtNumber(target,2)+" · Sapma "+fmtPercent(shortfall)});
        } else {
            insights.push({type:"positive",title:"😊 "+item.name+" hedefin üzerinde",text:item.name+" gerçekleşmesi gereken seviyenin üzerinde. Bu performansı koru ve diğer KPI'lara da odaklan.",detail:"Gerçekleşen "+fmtNumber(actual,2)+" · Beklenen "+fmtNumber(target,2)+" · Fark +"+fmtPercent(shortfall)});
        }
    });
    if (!insights.length) {
        root.innerHTML = '<div class="action-summary-empty">Günlük yorum oluşturmak için gerekli hedef ve gerçekleşen veriler bulunamadı. Veri mevcut olduğunda yorum otomatik hazırlanır.</div>';
        return;
    }
    const priority = {warning:0,neutral:1,positive:2};
    insights.sort((a,b)=>priority[a.type]-priority[b.type]);
    root.innerHTML = '<div class="action-summary-grid">'+insights.map(item=>'<article class="action-insight '+item.type+'"><strong>'+escapeHTML(item.title)+'</strong><p>'+escapeHTML(item.text)+'</p><small>'+escapeHTML(item.detail)+'</small></article>').join("")+'</div>';
}


function organizeStoreStatusTabs() {
    const panel = document.querySelector(".store-status-panel");
    const root = document.getElementById("performanceSections");
    const summary = document.getElementById("storeActionSummary");
    if (!panel || !root || !summary || panel.dataset.tabsReady === "true") return;
    const period = root.querySelector(".period-group");
    const targets = root.querySelector(".targets-group");
    const daily = root.querySelector(".daily-group");
    const kpi = root.querySelector(".kpi-group");
    const forecast = root.querySelector(".forecast-group");
    const comparisons = [...root.querySelectorAll(".comparison-group")];
    if (!period || !targets || !daily || !kpi || !forecast || comparisons.length < 3) return;
    panel.dataset.tabsReady = "true";
    const tabs = document.createElement("div");
    tabs.className = "store-status-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Mağaza raporu sayfaları");
    tabs.innerHTML = '<button type="button" class="store-status-tab active" role="tab" aria-selected="true" data-store-tab="performance">Mağaza Durumu</button><button type="button" class="store-status-tab" role="tab" aria-selected="false" data-store-tab="details">Kategori &amp; Stok</button>';
    const first = document.createElement("div");
    first.className = "store-status-page";
    first.id = "storePerformancePage";
    first.setAttribute("role", "tabpanel");
    const second = document.createElement("div");
    second.className = "store-status-page";
    second.id = "storeDetailsPage";
    second.setAttribute("role", "tabpanel");
    second.hidden = true;
    const title = document.createElement("h3");
    title.className = "store-tab-section-title";
    title.textContent = "Kategori, Cinsiyet ve Stok Değerlendirmesi";
    const commentary = document.createElement("section");
    commentary.className = "store-action-summary category-stock-summary";
    commentary.innerHTML = '<div class="action-summary-head"><div><p class="dashboard-eyebrow">GENEL DETAYLAR</p><h3>Kategori &amp; Stok Yorumları</h3><p>Kategori, cinsiyet ve stok dağılımı için takip notları</p></div></div><div class="action-summary-grid"><article class="action-insight positive"><strong>😊 Güçlü alanları koru</strong><p>Satış payı ve büyümesi öne çıkan kategori ve cinsiyet gruplarında ürün bulunurluğunu koru.</p></article><article class="action-insight warning"><strong>⚠️ Fırsat ve stok risklerini kontrol et</strong><p>Geride kalan kategori gruplarını, düşük stokları ve eksik bedenleri kontrol ederek aksiyon belirle.</p></article></div>';
    tabs.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
        const showFirst = button.dataset.storeTab === "performance";
        first.hidden = !showFirst;
        second.hidden = showFirst;
        tabs.querySelectorAll("button").forEach(tab => {
            const active = tab === button;
            tab.classList.toggle("active", active);
            tab.setAttribute("aria-selected", String(active));
        });
    }));
    panel.querySelector(".store-status-heading").insertAdjacentElement("afterend", tabs);
    tabs.insertAdjacentElement("afterend", first);
    first.append(root, summary);
    second.append(title, ...comparisons, commentary);
    first.insertAdjacentElement("afterend", second);
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


// Günlük görevler ve VM standartları
function showDailyTasks() {
  ["mainMenu","productSearchArea","sizeSearchArea","educationArea","vmStandardsArea"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="none";});
  const el=document.getElementById("dailyTasksArea");if(el)el.style.display="block";
  window.scrollTo({top:0,behavior:"smooth"});
}
function showVmStandards() {
  ["mainMenu","productSearchArea","sizeSearchArea","educationArea","dailyTasksArea"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display="none";});
  const el=document.getElementById("vmStandardsArea");if(el)el.style.display="block";
  window.scrollTo({top:0,behavior:"smooth"});
}
function updateDailyTaskProgress() {
  const items=[...document.querySelectorAll("#dailyTaskList .work-task")];
  const done=items.filter(item=>item.querySelector("select")?.value && item.querySelector("textarea")?.value.trim()).length;
  const total=items.length;
  const label=document.getElementById("dailyTaskProgress"),bar=document.getElementById("dailyTaskProgressBar");
  if(label)label.textContent=done+" / "+total+" yanıtlandı";
  if(bar)bar.style.width=(total?done/total*100:0)+"%";
  items.forEach(item=>item.classList.toggle("done",!!item.querySelector("select")?.value && !!item.querySelector("textarea")?.value.trim()));
}
async function saveDailyTasks() {
  const button = document.getElementById("saveDailyTasksButton");
  const status = document.getElementById("dailyTaskSaveStatus");
  const firstName = document.getElementById("dailyTaskFirstName")?.value.trim() || "";
  const lastName = document.getElementById("dailyTaskLastName")?.value.trim() || "";
  const items = [...document.querySelectorAll("#dailyTaskList .work-task")];
  if (!firstName || !lastName) {
    if (status) status.textContent = "Lütfen kaydetmeden önce adınızı ve soyadınızı yazın.";
    document.getElementById(!firstName ? "dailyTaskFirstName" : "dailyTaskLastName")?.focus();
    return;
  }
  const tasks = items.map(item => ({
    task: item.querySelector("strong")?.textContent.trim() || "Görev",
    result: item.querySelector("select")?.value || "",
    note: item.querySelector("textarea")?.value.trim() || ""
  }));
  const unanswered = tasks.filter(task => !task.result || !task.note);
  if (unanswered.length) {
    if (status) status.textContent = "Göndermeden önce tüm maddeler için kontrol sonucu seçin ve açıklama yazın. Eksik madde: " + unanswered.length;
    items.find(item => !item.querySelector("select")?.value || !item.querySelector("textarea")?.value.trim())?.scrollIntoView({behavior:"smooth",block:"center"});
    return;
  }
  if (button) { button.disabled = true; button.textContent = "Gönderiliyor…"; }
  if (status) status.textContent = "Kontrol listesi e-posta ile gönderiliyor…";
  try {
    const response = await fetch("/api/daily-task-notification", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        firstName, lastName,
        submittedAt: new Date().toISOString(),
        tasks
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "E-posta gönderilemedi.");
    if (status) status.textContent = "✓ Kontrol listesi başarıyla e-posta ile gönderildi.";
    if (window.alert) alert("Günlük görev kontrol listeniz yöneticiye gönderildi.");
  } catch (error) {
    if (status) status.textContent = "Gönderim başarısız: " + (error.message || "Lütfen tekrar deneyin.");
  } finally {
    if (button) { button.disabled = false; button.textContent = "✓ Görevleri Kaydet ve Bildir"; }
  }
}
function updateVmProgress() {
  const boxes=[...document.querySelectorAll("#vmTaskList input[type=checkbox]")],count=boxes.filter(x=>x.checked).length;
  const label=document.getElementById("vmProgress"),bar=document.getElementById("vmProgressBar");
  if(label)label.textContent=count+" / "+boxes.length+" tamamlandı";if(bar)bar.style.width=(count/boxes.length*100)+"%";
  boxes.forEach(x=>x.closest(".work-task")?.classList.toggle("done",x.checked));
}
