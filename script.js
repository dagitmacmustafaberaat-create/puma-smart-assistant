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
        .replace(/^\[/, "")        .replace(/\]$/, "")
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
function showMainMenu() {
    const mainMenu = document.getElementById("mainMenu");
    const productSearchArea = document.getElementById("productSearchArea");
    const sizeSearchArea = document.getElementById("sizeSearchArea");
    const results = document.getElementById("results");
    const sizeResults = document.getElementById("sizeResults");

    if (mainMenu) mainMenu.style.display = "flex";
    if (productSearchArea) productSearchArea.style.display = "none";
    if (sizeSearchArea) sizeSearchArea.style.display = "none";
    if (results) results.innerHTML = "";
    if (sizeResults) sizeResults.innerHTML = "";
}

// ======================================================
// ÜRÜN SORGULAMA
// ======================================================
function showProductSearch() {
    const mainMenu = document.getElementById("mainMenu");
    const productSearchArea = document.getElementById("productSearchArea");
    const sizeSearchArea = document.getElementById("sizeSearchArea");

    if (mainMenu) mainMenu.style.display = "none";
    if (productSearchArea) productSearchArea.style.display = "block";
    if (sizeSearchArea) sizeSearchArea.style.display = "none";

    const input = document.getElementById("searchInput");

    if (input) {
        input.value = "";
        setTimeout(function () {
            input.focus();
        }, 100);
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

    if (mainMenu) mainMenu.style.display = "none";
    if (productSearchArea) productSearchArea.style.display = "none";
    if (sizeSearchArea) sizeSearchArea.style.display = "block";

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

// ======================================================
// SD KARNE MODÜLÜ
// ======================================================
let sdKarneData = [
    { adi: "SİNEM PALAZ", gorev: "Satış Görevlisi", ciro: 177755.0, fatura: 30, adet: 46, upt: 1.53, atv: 5925.17, asp: 3864.24 },
    { adi: "SERKAN CANİK", gorev: "Supervisor", ciro: 106106.0, fatura: 19, adet: 28, upt: 1.47, atv: 5584.53, asp: 3789.50 },
    { adi: "CEM AKTAŞ", gorev: "Satış Danışmanı", ciro: 139250.0, fatura: 25, adet: 36, upt: 1.44, atv: 5570.00, asp: 3868.06 },
    { adi: "MERVE ÇETİN", gorev: "Satış Danışmanı", ciro: 124369.0, fatura: 16, adet: 34, upt: 2.13, atv: 7773.06, asp: 3657.91 },
    { adi: "ECE NUR TEMÜR", gorev: "Satış Danışmanı", ciro: 82502.0, fatura: 15, adet: 19, upt: 1.27, atv: 5500.13, asp: 4342.21 }
];

function openSDKarne() {
    let modal = document.getElementById('sdKarneModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sdKarneModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    let tableRows = sdKarneData.map((person, index) => `
        <tr>
            <td><strong>${escapeHTML(person.adi)}</strong></td>
            <td>${escapeHTML(person.gorev)}</td>
            <td><input type="number" value="${person.ciro}" onchange="updateKarne(${index}, 'ciro', this.value)"></td>
            <td><input type="number" value="${person.fatura}" onchange="updateKarne(${index}, 'fatura', this.value)"></td>
            <td><input type="number" value="${person.adet}" onchange="updateKarne(${index}, 'adet', this.value)"></td>
            <td id="upt_${index}">${person.upt}</td>
            <td id="atv_${index}">${person.atv}</td>
            <td id="asp_${index}">${person.asp}</td>
        </tr>
    `).join('');

    modal.innerHTML = `
        <div class="modal-content wide-modal">
            <div class="modal-header">
                <h2>📊 Buyaka PUMA - SD Karne Takip Tablosu</h2>
                <button onclick="closeSDK