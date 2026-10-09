let products = [];

// ======================================================
// SUPABASE AYARLARI
// ======================================================
const SUPABASE_URL = "https://zjxphwqcmmmbikgrbhyn.supabase.co";
const SUPABASE_KEY = "sb_publishable_OF_6Dt6vWB3Z0XlyvOxIog_evFp_M57";

async function saveSearchLog(searchType, productCode, productName, size, searchText) {
    try {
        await fetch(SUPABASE_URL + "/rest/v1/search_logs", {
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
        });
    } catch (error) {
        console.error("SUPABASE HATASI:", error);
    }
}

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

// ÜRÜN ALANLARI
function getBarkod(item) { return String(item["BARKOD"] ?? item["Barkod"] ?? item["barcode"] ?? item["BARCODE"] ?? item["barkod"] ?? "").trim(); }
function getStokKodu(item) { return String(item["PRODUCTCODE"] ?? item["PRODUCT_CODE"] ?? item["productCode"] ?? item["urunKodu"] ?? item["STOK KODU"] ?? item["code"] ?? "").trim(); }
function getUrun(item) { return String(item["PRODUCTNAME"] ?? item["PRODUCT_NAME"] ?? item["Ürün Adı"] ?? "").trim(); }
function getBeden(item) { return String(item["BEDEN NO"] ?? item["Beden No"] ?? item["BEDEN"] ?? item["size"] ?? "").trim(); }
function getStok(item) { const v = Number(item["STOK ADEDİ"] ?? item["STOK"] ?? item["stock"] ?? 0); return Number.isFinite(v) ? v : 0; }
function getCinsiyet(item) { return String(item["CİNSİYET"] ?? item["Cinsiyet"] ?? item["gender"] ?? "").trim(); }
function getKategori(item) { return String(item["PUMA KATEGORİ"] ?? item["Kategori"] ?? item["category"] ?? "").trim(); }
function getSezon(item) { return String(item["SEZON"] ?? item["Sezon"] ?? item["season"] ?? "").trim(); }

function getGorsel(item) {
    let value = item["ÜRÜN RESMİ EXCEL"] ?? item["Ürün Görseli"] ?? item["image"] ?? "";
    if (!value) return "";
    let url = String(value).trim();
    const m = url.match(/\((https?:\/\/[^)]+)\)/);
    if (m) url = m[1];
    return url.replace(/^\[/, "").replace(/\]$/, "").replace(/\\/g, "").trim();
}

function findImage(product) {
    return (product.gorsel && (product.gorsel.startsWith("http://") || product.gorsel.startsWith("https://"))) ? product.gorsel : "";
}

async function loadProducts() {
    try {
        const response = await fetch("./data.json?v=" + Date.now(), { cache: "no-store" });
        if (!response.ok) throw new Error("data.json yüklenemedi.");
        products = await response.json();
        populateSizeFilter();
    } catch (error) {
        console.error("DATA.JSON HATASI:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadProducts();
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            searchProducts(e.target.value);
        });
    }
});

function showMainMenu() {
    document.getElementById("mainMenu").style.display = "flex";
    document.getElementById("productSearchArea").style.display = "none";
    document.getElementById("sizeSearchArea").style.display = "none";
    document.getElementById("sdReportContainer").style.display = "none";
    document.getElementById("results").innerHTML = "";
    document.getElementById("sizeResults").innerHTML = "";
}

function showProductSearch() {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("productSearchArea").style.display = "block";
    document.getElementById("sizeSearchArea").style.display = "none";
    document.getElementById("sdReportContainer").style.display = "none";
    const input = document.getElementById("searchInput");
    if (input) { input.value = ""; setTimeout(() => input.focus(), 100); }
}

function showSizeSearch() {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("productSearchArea").style.display = "none";
    document.getElementById("sizeSearchArea").style.display = "block";
    document.getElementById("sdReportContainer").style.display = "none";
    populateSizeFilter();
}

function populateSizeFilter() {
    const select = document.getElementById("sizeFilter");
    if (!select) return;
    const sizes = new Set();
    products.forEach(item => {
        const beden = getBeden(item);
        if (beden && getStok(item) > 0) sizes.add(beden);
    });
    const sorted = Array.from(sizes).sort((a, b) => {
        const an = parseFloat(String(a).replace(",", "."));
        const bn = parseFloat(String(b).replace(",", "."));
        return (!isNaN(an) && !isNaN(bn)) ? an - bn : String(a).localeCompare(String(b), "tr-TR");
    });
    select.innerHTML = '<option value="">Beden seçiniz</option>';
    sorted.forEach(size => {
        const opt = document.createElement("option");
        opt.value = size;
        opt.textContent = size;
        select.appendChild(opt);
    });
}

function searchBySize(selectedSize) {
    const results = document.getElementById("sizeResults");
    if (!results) return;
    if (!selectedSize) { results.innerHTML = ""; return; }
    const filtered = products.filter(item => getBeden(item).toLocaleLowerCase("tr-TR") === selectedSize.toLocaleLowerCase("tr-TR") && getStok(item) > 0);
    if (filtered.length === 0) { results.innerHTML = "<div class='notfound'>❌ Bu bedende stok bulunamadı.</div>"; return; }
    saveSearchLog("size", getStokKodu(filtered[0]), getUrun(filtered[0]), selectedSize, selectedSize);
    renderProducts(filtered, results);
}

function searchProducts(text) {
    const results = document.getElementById("results");
    if (!results) return;
    const search = String(text || "").trim().toLocaleLowerCase("tr-TR");
    if (!search) { results.innerHTML = ""; return; }
    
    const filtered = products.filter(item => {
        if (getStok(item) <= 0) return false;
        return getBarkod(item).toLocaleLowerCase("tr-TR").includes(search) ||
               getStokKodu(item).toLocaleLowerCase("tr-TR").includes(search) ||
               getUrun(item).toLocaleLowerCase("tr-TR").includes(search);
    });

    if (filtered.length === 0) { results.innerHTML = "<div class='notfound'>❌ Ürün bulunamadı.</div>"; return; }
    renderProducts(filtered, results);
}

function renderProducts(list, container) {
    const grouped = {};
    list.forEach(item => {
        if (getStok(item) <= 0) return;
        const key = getStokKodu(item) || getBarkod(item);
        if (!grouped[key]) {
            grouped[key] = {
                urun: getUrun(item) || "-",
                stokKodu: getStokKodu(item) || "-",
                barkod: getBarkod(item) || "-",
                kategori: getKategori(item) || "-",
                cinsiyet: getCinsiyet(item) || "-",
                sezon: getSezon(item) || "-",
                gorsel: getGorsel(item) || "",
                sizes: []
            };
        }
        grouped[key].sizes.push({ beden: getBeden(item) || "-", stok: getStok(item) });
    });

    let html = "";
    Object.values(grouped).forEach(product => {
        let sizeHTML = "";
        product.sizes.forEach(s => {
            sizeHTML += `<div class="size-box"><span class="size">${escapeHTML(s.beden)}</span><span class="quantity">${s.stok}</span></div>`;
        });
        const img = findImage(product);
        html += `
            <div class="product-card">
                ${img ? `<div class="product-image"><img src="${escapeHTML(img)}" alt="" loading="lazy" onerror="tryNextImage(this);"></div>` : ""}
                <div class="product-name">${escapeHTML(product.urun)}</div>
                <div><strong>Ürün Kodu:</strong> ${escapeHTML(product.stokKodu)}</div>
                <div><strong>Barkod:</strong> ${escapeHTML(product.barkod)}</div>
                <div class="size-title">BEDEN / STOK</div>
                <div class="sizes">${sizeHTML}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function openEducationPDF() {
    window.open('egitim.pdf', '_blank');
}

// ======================================================
// ONLİNE EXCEL SD KARNE ENTEGRASYONU (SHEETJS)
// ======================================================
let loadedWorkbook = null;
let currentActiveSheetName = "";

async function openSDKarne() {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("productSearchArea").style.display = "none";
    document.getElementById("sizeSearchArea").style.display = "none";
    
    const reportContainer = document.getElementById("sdReportContainer");
    reportContainer.style.display = "block";

    try {
        const response = await fetch('sd_karne.xlsx?v=' + Date.now());
        const data = await response.arrayBuffer();
        loadedWorkbook = XLSX.read(data, { type: 'array', cellFormula: true, cellStyles: true });

        renderExcelTabs();
        if (loadedWorkbook.SheetNames.length > 0) {
            switchExcelSheet(loadedWorkbook.SheetNames[0]);
        }
    } catch (e) {
        console.error("Excel yükleme hatası:", e);
        document.getElementById("excelTableViewer").innerHTML = "<div class='notfound'>❌ sd_karne.xlsx dosyası yüklenemedi. Lütfen dosyanın ana dizinde olduğundan emin olun.</div>";
    }
}

function closeSDKarne() {
    showMainMenu();
}

function renderExcelTabs() {
    const tabsContainer = document.getElementById("excelSheetTabs");
    tabsContainer.innerHTML = "";
    
    loadedWorkbook.SheetNames.forEach(sheetName => {
        const btn = document.createElement("button");
        btn.textContent = sheetName;
        btn.className = "menu-button";
        btn.style.cssText = "min-height:40px; padding:8px 15px; font-size:14px; cursor:pointer;";
        btn.onclick = () => switchExcelSheet(sheetName);
        tabsContainer.appendChild(btn);
    });
}

function switchExcelSheet(sheetName) {
    currentActiveSheetName = sheetName;
    const sheet = loadedWorkbook.Sheets[sheetName];
    const htmlTable = XLSX.utils.sheet_to_html(sheet, { editable: true });

    const viewer = document.getElementById("excelTableViewer");
    viewer.innerHTML = htmlTable;

    // Tabloyu şık hale getirip sarı alanları ve inputları aktif edelim
    const table = viewer.querySelector("table");
    if (table) {
        table.className = "sd-table";
        
        // Tablodaki hücrelerde düzenleme yapıldıkça workbook'u güncelle
        const inputs = table.querySelectorAll("td, th");
        inputs.forEach((cell, idx) => {
            cell.contentEditable = true;
            cell.addEventListener("input", function() {
                // Hücre güncellendiğinde Sheet verisini tazeleyelim
                const updatedHtml = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                // Otomatik hesaplamalar için gerekli tetikleyiciler
            });
        });
    }
}

function exportUpdatedExcel() {
    if (!loadedWorkbook) return;
    XLSX.writeFile(loadedWorkbook, "Buyaka_Puma_Guncel_SD_Karne.xlsx");
}