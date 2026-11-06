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

function showStoreStatus() {
    const mainMenu = document.getElementById("mainMenu");
    const area = document.getElementById("storeStatusArea");
    if (mainMenu) mainMenu.style.display = "none";
    ["productSearchArea","sizeSearchArea","educationArea","shiftProgramArea","sdKarneArea","performanceLeagueArea","top5AnalysisArea","fastPerakendeArea","dailyTasksArea","vmStandardsArea"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
    if (area) area.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeStoreStatus() {
    showMainMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showMainMenu() {
    const mainMenu = document.getElementById("mainMenu");
    const storeStatusArea = document.getElementById("storeStatusArea");
    if (storeStatusArea) storeStatusArea.style.display = "none";
    const storeManagementArea = document.getElementById("storeManagementArea");
    if (storeManagementArea) storeManagementArea.style.display = "none";
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
    const fastPerakendeArea = document.getElementById("fastPerakendeArea");
    if (fastPerakendeArea) fastPerakendeArea.style.display = "none";
    const sdKarneArea = document.getElementById("sdKarneArea");
    if (sdKarneArea) sdKarneArea.style.display = "none";
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
        if (!window.XLSX) throw new Error("Excel okuma kütüphanesi yüklenemedi.");
        const excelUrl = "https://raw.githubusercontent.com/dagitmacmustafaberaat-create/puma-smart-assistant/main/Kas%C4%B1m%202026%20Data.xlsx";
        const response = await fetch(excelUrl + "?v=" + Date.now(), { cache: "no-store" });
        if (!response.ok) throw new Error("GitHub'daki Kasım 2026 Data.xlsx dosyasına erişilemedi.");
        const workbook = XLSX.read(await response.arrayBuffer(), { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) throw new Error("Excel sayfası bulunamadı.");

        const cells = {};
        const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let column = range.s.c; column <= range.e.c; column++) {
                const address = XLSX.utils.encode_cell({ r: row, c: column });
                const sourceCell = sheet[address];
                if (!sourceCell) continue;
                const value = sourceCell.t === "e" ? (sourceCell.w || "#EXCEL HATASI") : sourceCell.v;
                if (value === undefined || value === null || value === "") continue;
                cells[address] = { value, number_format: sourceCell.z || "General" };
            }
        }
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
        const kpiCards = kpiRows.map(([label, row]) => {
            const targetValue = Number(raw("C" + row));
            const actualValue = Number(raw("D" + row));
            const statusClass = Number.isFinite(targetValue) && Number.isFinite(actualValue)
                ? (actualValue >= targetValue ? "status-positive" : "status-negative")
                : "status-neutral";
            const kpiFormat = (address, field) => {
                const cell = get(address);
                if (!cell) return "—";
                if ((label === "Ciro" || label === "ASP") && field !== "Sapma") {
                    const amount = Number(cell.value);
                    if (Number.isFinite(amount)) return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(amount) + " TL";
                }
                if (field === "Sapma") return new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 1 }).format(Number(cell.value));
                return format(cell);
            };
            return `
            <article class="kpi-row-card ${statusClass}">
              <h4>${safe(label)}</h4>
              <div class="kpi-values">
                <div><span>Gerçekleşmesi Gereken</span><strong>${kpiFormat("C" + row, "Hedef")}</strong></div>
                <div><span>Gerçekleşen</span><strong>${kpiFormat("D" + row, "Gerçekleşen")}</strong></div>
                <div><span>Fark</span><strong>${kpiFormat("E" + row, "Fark")}</strong></div>
                <div><span>Sapma</span><strong>${kpiFormat("F" + row, "Sapma")}</strong></div>
              </div>
            </article>`;
        });

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
        const targetPeriod = String(raw("B7") || "Aylık").replace(/\s+Hedefler.*$/i, "").replace(/\.(?=\d)/g, " ").replace(/\b(\d{2})\b/g, "20$1");
        groups.push(section(targetPeriod + " Hedefleri", "Tablodaki aylık hedef değerleri", targets.map(([label, address]) => card(label, get(address))), "targets-group"));
        groups.push(section("Günlük Yapılması Gerekenler", "Tablodaki günlük değerler; yeniden hesaplanmaz", daily.map(([label, address]) => card(label, get(address))), "daily-group"));
        groups.push(section("Bugüne Kadar: Hedef ve Gerçekleşen", "Excel tablosundaki KPI, fark ve sapma değerleri", kpiCards, "kpi-group"));
        groups.push(section("Tahmini Kapanış", "Tablodaki mevcut tahmin ve HGO değeri", [
            card("Tahmini Kapanış Cirosu", get("C25"), "metric-card-featured"),
            card(String(raw("E25") || "HGO"), { ...get("F25"), number_format: "0.00%" }, "metric-card-featured")
        ], "forecast-group"));
        groups.push(section("Kategori Bazlı Ciro Karşılaştırması", "Tabloda bulunan 2025 / 2026 ve büyüme değerleri", categoryCards, "comparison-group"));
        groups.push(section("Cinsiyet Bazlı Karşılaştırma", "Tablodaki değerler olduğu gibi gösterilir", genderCards, "comparison-group"));
        groups.push(section("Kategori Bazlı Stok Karşılaştırması", "2025 ve 2026 değerleri", stockCards, "comparison-group"));


        const numeric = address => {
            const value = Number(raw(address));
            return Number.isFinite(value) ? value : null;
        };
        const chartNumber = (value, currency = false) => {
            if (value === null || value === undefined) return "—";
            return new Intl.NumberFormat("tr-TR", {
                maximumFractionDigits: currency ? 0 : 2
            }).format(value) + (currency ? " TL" : "");
        };
        const safeChartLabel = value => escapeHTML(value === null || value === undefined ? "—" : value);
        const kpiChartRows = kpiRows.map(([label, row]) => ({
            name: label,
            old: numeric("C" + row),
            current: numeric("D" + row),
            currency: label === "Ciro" || label === "ASP"
        })).filter(item => item.old !== null && item.current !== null).map(item => ({
            ...item,
            rate: item.old === 0 ? 0 : item.current / item.old * 100
        }));
        const attainmentChart = () => compareChart(
            "KPI Hedef Gerçekleşme",
            "HEDEF / GERÇEKLEŞEN",
            kpiChartRows,
            "Hedef",
            "Gerçekleşen",
            false,
            "store-chart-kpi"
        );
        const compareChart = (title, kicker, entries, oldLabel, newLabel, currency = false, extraClass = "") => {
            const valid = entries.filter(item => item.old !== null || item.current !== null);
            if (!valid.length) return '<article class="store-chart-card ' + extraClass + '"><div class="store-chart-heading"><div><span class="store-chart-kicker">' + kicker + '</span><h3>' + title + '</h3></div></div><div class="store-chart-empty">Karşılaştırma verisi bulunamadı.</div></article>';
            const max = Math.max(1, ...valid.flatMap(item => [item.old || 0, item.current || 0]));
            return '<article class="store-chart-card ' + extraClass + '"><div class="store-chart-heading"><div><span class="store-chart-kicker">' + kicker + '</span><h3>' + title + '</h3></div><div class="store-chart-legend"><i class="previous"></i> ' + oldLabel + '<i class="actual"></i> ' + newLabel + '</div></div><div class="store-demo-chart">' +
                valid.map(item => {
                    const oldWidth = Math.max(0, (item.old || 0) / max * 100);
                    const currentWidth = Math.max(0, (item.current || 0) / max * 100);
                    const change = item.rate !== undefined ? item.rate : (item.old ? ((item.current || 0) / item.old - 1) * 100 : 0);
                    const changeLabel = (change > 0 ? "+" : "") + chartNumber(change) + "%";
                    return '<div class="store-demo-row"><div class="store-demo-label"><strong>' + safeChartLabel(item.name) + '</strong><small>' + oldLabel + ' / ' + newLabel + '</small><span class="store-demo-rate">' + changeLabel + '</span></div><div class="store-demo-bars"><div class="store-demo-barline"><div class="store-demo-track"><i class="previous" style="width:' + oldWidth + '%"></i></div><b>' + chartNumber(item.old, item.currency ?? currency) + '</b></div><div class="store-demo-barline"><div class="store-demo-track"><i class="actual" style="width:' + currentWidth + '%"></i></div><b>' + chartNumber(item.current, item.currency ?? currency) + '</b></div></div></div>';
                }).join("") +
                '</div></article>';
        };
        const categoryChartEntries = [
            {name:raw("H4"),old:numeric("I5"),current:numeric("J5")},
            {name:raw("H7"),old:numeric("I8"),current:numeric("J8")},
            {name:raw("H10"),old:numeric("I11"),current:numeric("J11")}
        ].filter(item => item.name !== null && item.name !== undefined);
        const genderChartEntries = [15,16,17,18,19].map(row => ({
            name:raw("H"+row),old:numeric("I"+row),current:numeric("J"+row)
        })).filter(item => item.name !== null && item.name !== undefined);
        const stockChartEntries = [24,25,26,27].map(row => ({
            name:raw("H"+row),old:numeric("I"+row),current:numeric("J"+row)
        })).filter(item => item.name !== null && item.name !== undefined);
        const charts = '<section class="store-charts-grid" aria-label="Grafiklerle mağaza performansı">' +
            attainmentChart() +
            compareChart("Kategori Bazlı Ciro","KATEGORİ PERFORMANSI",categoryChartEntries,"2025","2026",true,"store-chart-category") +
            compareChart("Cinsiyet Bazlı Ciro","CİNSİYET KIRILIMI",genderChartEntries,"2025","2026",true,"store-chart-gender") +
            compareChart("Kategori Bazlı Stok","ENVANTER KARŞILAŞTIRMASI",stockChartEntries,"2025","2026",false,"store-chart-stock") +
            '</section>';

        root.innerHTML = charts + groups.join("");
        const kpiSection = root.querySelector(".kpi-group");
        const kpiHeading = kpiSection && kpiSection.querySelector(".performance-group-heading");
        const kpiGrid = kpiSection && kpiSection.querySelector(".metric-card-grid");
        if (kpiHeading && kpiGrid) {
            const filter = document.createElement("select");
            filter.className = "kpi-filter-select";
            filter.setAttribute("aria-label", "KPI seç");
            filter.innerHTML = '<option value="all">Tüm KPI’lar</option>' +
                kpiRows.map(([label]) => '<option value="' + escapeHTML(label) + '">' + escapeHTML(label) + '</option>').join("");
            filter.addEventListener("change", () => {
                const selected = filter.value;
                kpiGrid.querySelectorAll(".kpi-row-card").forEach(item => {
                    item.hidden = selected !== "all" && item.querySelector("h4")?.textContent !== selected;
                });
                renderStoreActionSummary(cells, selected);
                applySelectedKpiLayout(kpiGrid, document.getElementById("storeActionSummary"), selected);
            });
            kpiHeading.appendChild(filter);
        }
        renderStoreActionSummary(cells);
        organizeStoreStatusTabs();
        renderStoreStatusVerticalDashboard(cells);
    } catch (error) {
        console.error("MAĞAZA PERFORMANS VERİSİ HATASI:", error);
        root.innerHTML = '<div class="performance-loading">Mağaza verisi şu anda okunamadı. Excel verisi ve otomatik güncelleme kontrol edilmeli.</div>';
    }
}

function applySelectedKpiLayout(kpiGrid, summaryRoot, selectedKpi) {
    if (!kpiGrid || !summaryRoot) return;
    const cards = [...kpiGrid.querySelectorAll(".kpi-row-card")];
    cards.forEach(card => {
        const oldLayout = card.querySelector(".kpi-selected-layout");
        if (oldLayout) {
            const values = oldLayout.querySelector(".kpi-values");
            if (values) card.insertBefore(values, oldLayout);
            oldLayout.remove();
        }
        card.classList.remove("kpi-card-selected");
    });
    kpiGrid.classList.toggle("kpi-grid-filtered", selectedKpi !== "all");
    summaryRoot.hidden = selectedKpi !== "all";
    if (selectedKpi === "all") return;

    const selectedCard = cards.find(card => card.querySelector("h4")?.textContent.trim() === selectedKpi);
    const insight = summaryRoot.querySelector(".action-insight");
    if (!selectedCard) return;
    const values = selectedCard.querySelector(".kpi-values");
    if (!values || !insight) return;

    const layout = document.createElement("div");
    layout.className = "kpi-selected-layout";
    selectedCard.classList.add("kpi-card-selected");
    layout.append(values, insight);
    selectedCard.appendChild(layout);
}

function renderStoreActionSummary(cells, selectedKpi = "all") {
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
        {name:"Ürün Adedi", target:"C22", actual:"D22", gap:"F22", action:"Birlikte kullanım ve tamamlayıcı ürün önerileriyle ürün adedini artır."},
        {name:"Trafik", target:"C23", actual:"D23", gap:"F23", action:"Mağaza içi karşılama ve dönüşüm hazırlığını güçlendir; trafik verisi tek başına müşteri davranışının nedenini göstermez."}
    ];
    const fmtNumber = (n, digits=1) => new Intl.NumberFormat("tr-TR", {maximumFractionDigits:digits}).format(n);
    const fmtPercent = n => new Intl.NumberFormat("tr-TR", {style:"percent",maximumFractionDigits:1}).format(n);
    const insights = [];
    definitions.filter(item => selectedKpi === "all" || item.name === selectedKpi).forEach(item => {
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



/* MAĞAZA DURUMU — onaylanan dört sekmeli premium rapor */
function organizeStoreStatusTabs() {
    const panel = document.querySelector(".store-status-panel");
    const source = document.getElementById("performanceSections");
    const summary = document.getElementById("storeActionSummary");
    if (!panel || !source) return;
    let page = document.getElementById("storePerformancePage");
    if (!page) {
        page = document.createElement("div");
        page.id = "storePerformancePage";
        page.className = "bp-dashboard";
        page.setAttribute("role", "region");
        page.setAttribute("aria-label", "Mağaza durumu raporu");
        const anchor = panel.querySelector(".back-button");
        if (anchor) anchor.insertAdjacentElement("afterend", page);
        else panel.insertBefore(page, source);
    }
    source.hidden = true;
    source.textContent = "";
    if (summary) { summary.hidden = true; summary.textContent = ""; }
}
function renderStoreStatusVerticalDashboard(cells) {
    const page = document.getElementById("storePerformancePage");
    if (!page) return;
    const raw = a => cells[a]?.value ?? null;
    const num = a => { const v=raw(a); if(v===null||v===""||v===undefined)return null; const n=Number(v); return Number.isFinite(n)?n:null; };
    const fmt = (n,d=0) => n===null||n===undefined?"—":new Intl.NumberFormat("tr-TR",{maximumFractionDigits:d}).format(n);
    const money = n => n===null||n===undefined?"—":"₺"+fmt(n,0);
    const pct = n => n===null||n===undefined?"—":(n>0?"+":"")+fmt(n,1)+"%";
    const growth = (a,b) => a===null||b===null||a===0?null:(b/a-1)*100;
    const monthDays = Math.max(1,Math.round(num("C4")||new Date().getDate()));
    const elapsed = Math.min(monthDays,Math.max(1,Math.round(num("C5")||new Date().getDate())));
    const dayGoal = (monthly)=>monthly===null?null:monthly/monthDays;
    const toDateGoal = monthly => monthly===null?null:monthly/monthDays*elapsed;
    const actualRows = [
      {name:"Ciro",monthly:"C8",actual:"D17",money:true},
      {name:"UPT",monthly:"C9",actual:"D18",ratio:true},
      {name:"CR",monthly:"C10",actual:"D19",ratio:true,percent:true},
      {name:"Fatura",monthly:"C12",actual:"D21"},
      {name:"Ürün Adedi",monthly:"C13",actual:"D22"},
      {name:"Trafik",monthly:"C14",actual:"D23"}
    ];
    const metricCard = item => {
      const target=num(item.monthly),actual=num(item.actual);
      const daily=item.ratio?target:dayGoal(target);
      const expected=item.ratio?target:toDateGoal(target);
      const delta=expected===null||expected===0||actual===null?null:(actual/expected-1)*100;
      const cls=delta===null?"neutral":delta>=0?"positive":"negative";
      const value=n=>item.money?money(n):item.percent&&n!==null?fmt(n*100,2)+"%":fmt(n,2);
      return '<article class="bp-metric '+cls+'"><div class="bp-metric-top"><span>'+item.name+'</span><b>'+pct(delta)+'</b></div><div class="bp-metric-main">'+value(actual)+'</div><div class="bp-metric-grid"><div><small>AYLIK HEDEF</small><strong>'+value(target)+'</strong></div><div><small>GÜNLÜK HEDEF</small><strong>'+value(daily)+'</strong></div><div><small>BUGÜNE KADAR</small><strong>'+value(expected)+'</strong></div></div><div class="bp-progress"><i style="width:'+Math.max(0,Math.min(100,delta===null?0:100+delta))+'%"></i></div><small class="bp-status">'+(delta===null?"Veri bekleniyor":delta>=0?"Hedefin üzerinde":"Hedefin gerisinde")+' · '+pct(delta)+'</small></article>';
    };
    const businessUnits=["SPORTSTYLE PRIME","MOTORSPORT","RTF","RUNNING"];
    const findRows=(from,to,excluded=[])=>{
      const out=[];
      for(let r=from;r<=to;r++){
        const name=String(raw("H"+r)||"").trim();
        const old=num("I"+r),current=num("J"+r);
        if(!name||old===null||current===null||excluded.includes(name.toLocaleUpperCase("tr-TR")))continue;
        out.push({name,old,current,rate:num("K"+r)??growth(old,current)});
      }
      return out;
    };
    const genderRows=findRows(15,19);
    // Kategori verileri Excel icinde uc satirli bloklar halindedir: baslik, ciro, buyume.
    // 2025/2026 yil etiketlerini ciro gibi gostermemek icin yalnizca ciro satirlarini oku.
    const categoryRows=[
      {name:raw("H4"),old:num("I5"),current:num("J5"),rate:num("I6")},
      {name:raw("H7"),old:num("I8"),current:num("J8"),rate:num("I9")},
      {name:raw("H10"),old:num("I11"),current:num("J11"),rate:num("I12")}
    ].filter(r=>r.name && r.old!==null && r.current!==null);
    const stockRows=findRows(24,27,businessUnits);
    const period="1–"+elapsed+" "+String(raw("B7")||"Kasım 2026").replace(/.*?(Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık).*?/i,"$1");
    const compareRows=(rows,currency=true)=>rows.length?rows.map(r=>{
      const change=r.rate===null||r.rate===undefined?growth(r.old,r.current):(Math.abs(r.rate)<=1?r.rate*100:r.rate);
      const cls=change===null?"neutral":change>=0?"positive":"negative";
      const amount=n=>currency?money(n):fmt(n);
      const status=change===null?"Karşılaştırma verisi yok":change>0?"2026 cirosu geçen yılın üzerinde":change<0?"2026 cirosu geçen yılın gerisinde":"Geçen yıl ile aynı seviyede";
      const diff=change===null?"":' · '+pct(change);
      return '<article class="bp-metric '+cls+' bp-compare-card"><div class="bp-metric-top"><span>'+escapeHTML(r.name)+'</span><b>'+pct(change)+'</b></div><div class="bp-category-values"><div><small>2025 CİRO</small><strong>'+amount(r.old)+'</strong></div><div><small>2026 CİRO</small><strong>'+amount(r.current)+'</strong></div></div><small class="bp-status">'+status+diff+'</small></article>';
    }).join(""):'<div class="bp-empty">Kategori cirosu için Excel’de 2025 ve 2026 karşılaştırma verisi bulunamadı.</div>';

    const styles='<style>'+
      '.bp-dashboard{color:#f7f7f8;font-family:inherit}.bp-hero{padding:9px 2px 20px;display:flex;justify-content:space-between;align-items:end;gap:16px}.bp-eyebrow{color:#ff3158;font-size:11px;font-weight:900;letter-spacing:2px}.bp-hero h2{font-size:clamp(27px,4vw,38px);line-height:1;margin:8px 0 0;font-weight:900;letter-spacing:-1px}.bp-hero h2 em{font-style:normal;color:#f32650}.bp-hero p{color:#c3c5cc;font-size:12px;line-height:1.6;max-width:260px;text-align:right}.bp-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 16px}.bp-tab{min-width:0;border:1px solid #30333a;border-radius:12px;background:#14171c;color:#d7d9df;padding:13px 8px;font-weight:850;font-size:12px;cursor:pointer}.bp-tab.active{background:#e91d4d;border-color:#e91d4d;color:#fff;box-shadow:0 7px 20px #e91d4d33}.bp-panel{display:none}.bp-panel.active{display:block}.bp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.bp-metric,.bp-compare-row,.bp-comment{background:linear-gradient(145deg,#1b1e23,#111318);border:1px solid #30333a;border-radius:17px;padding:17px;min-width:0}.bp-metric.positive{border-color:#236d54}.bp-metric.negative{border-color:#8e243b}.bp-metric-top,.bp-compare-title{display:flex;justify-content:space-between;align-items:center;gap:10px}.bp-metric-top span{font-size:13px;font-weight:850}.bp-metric-top b,.bp-compare-title b{font-size:12px}.bp-metric-main{font-size:clamp(25px,4vw,34px);font-weight:950;letter-spacing:-.8px;margin:12px 0}.bp-metric-grid,.bp-compare-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.bp-metric-grid>div,.bp-compare-values>div{min-width:0}.bp-metric-grid small,.bp-compare-values small{display:block;color:#9ea3ad;font-size:9px;letter-spacing:.7px;margin-bottom:5px}.bp-metric-grid strong,.bp-compare-values strong{display:block;font-size:12px;overflow-wrap:anywhere}.bp-progress{height:5px;background:#30333a;border-radius:9px;margin:14px 0 7px;overflow:hidden}.bp-progress i{display:block;height:100%;background:#e91d4d;border-radius:9px}.bp-status{color:#bfc3cc;font-size:10px}.positive{color:#5ce0ad}.negative{color:#ff5877}.neutral{color:#c5c8d0}.bp-compare-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.bp-compare-card{padding:17px}.bp-category-values{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0 12px}.bp-category-values>div{min-width:0}.bp-category-values small{display:block;color:#9ea3ad;font-size:10px;letter-spacing:.8px;margin-bottom:7px}.bp-category-values strong{display:block;font-size:clamp(17px,3vw,23px);font-weight:900;overflow-wrap:anywhere}.bp-comment{margin-top:15px;background:linear-gradient(135deg,#260d16,#151015);border-color:#792039}.bp-comment small{color:#ff5272;font-size:10px;font-weight:900;letter-spacing:1.5px}.bp-comment h3{margin:7px 0 8px;font-size:17px}.bp-comment p{margin:0;color:#d1d2d8;font-size:12px;line-height:1.7}.bp-empty{padding:22px;border:1px dashed #41444d;border-radius:14px;color:#c5c7ce;font-size:12px;line-height:1.6}.bp-period{color:#b9bdc7;font-size:11px;margin:0 0 12px}@media(max-width:650px){.bp-compare-list{grid-template-columns:1fr}.bp-hero{display:block}.bp-hero p{text-align:left;margin:9px 0 0}.bp-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.bp-grid{grid-template-columns:1fr}.bp-metric{padding:15px}.bp-metric-grid strong,.bp-compare-values strong{font-size:11px}}'+
      '</style>';
    page.innerHTML=styles+
      '<nav class="bp-tabs" role="tablist" aria-label="Mağaza rapor sekmeleri"><button class="bp-tab active" data-tab="store" role="tab" aria-selected="true">Mağaza Genel Data</button><button class="bp-tab" data-tab="category" role="tab" aria-selected="false">Kategori Data</button><button class="bp-tab" data-tab="gender" role="tab" aria-selected="false">Cinsiyet Data</button><button class="bp-tab" data-tab="stock" role="tab" aria-selected="false">Stok Data</button></nav>'+
      '<section class="bp-panel active" data-panel="store"><div class="bp-grid">'+actualRows.map(metricCard).join("")+'</div></section>'+
      '<section class="bp-panel" data-panel="category"><div class="bp-compare-list">'+compareRows(categoryRows,true)+'</div></section>'+
      '<section class="bp-panel" data-panel="gender"><div class="bp-compare-list">'+compareRows(genderRows,true)+'</div></section>'+
      '<section class="bp-panel" data-panel="stock"><div class="bp-compare-list">'+compareRows(stockRows,false)+'</div></section>';
    page.querySelectorAll(".bp-tab").forEach(button=>button.addEventListener("click",()=>{
      const key=button.dataset.tab;
      page.querySelectorAll(".bp-tab").forEach(tab=>{const active=tab===button;tab.classList.toggle("active",active);tab.setAttribute("aria-selected",String(active));});
      page.querySelectorAll(".bp-panel").forEach(panel=>panel.classList.toggle("active",panel.dataset.panel===key));
    }));
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
  if (status) status.textContent = "Kontrol listesi GitHub’a tarihli dosya olarak kaydediliyor…";
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
    if (!response.ok) throw new Error(data.error || "GitHub kaydı yapılamadı.");
    if (status) status.textContent = "✓ Görevler GitHub’a " + data.date + " tarihli dosya olarak kaydedildi.";
    if (window.alert) alert("Günlük görev kontrol listeniz GitHub’a kaydedildi: " + data.path);
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

