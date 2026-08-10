```javascript
let products = [];

// ======================================================
// VERİLERİ YÜKLE
// ======================================================

async function loadProducts() {
    try {
        const response = await fetch("./data.json");

        if (!response.ok) {
            throw new Error("data.json bulunamadı");
        }

        const rawData = await response.json();

        // Yeni JSON yapısını uygulamanın kullandığı yapıya çevir
        products = rawData.map(item => ({
            barkod: item["Barkod"] ?? item.barkod ?? "",
            urun: item["Ürün Adı"] ?? item.urun ?? "",
            beden: item["Beden No"] ?? item.beden ?? "",
            stok: Number(item["Stok Adedi"] ?? item.stok ?? 0),
            stokKodu: item["Ürün Kodu"] ?? item.stokKodu ?? "",
            renk: item["Renk"] ?? item.renk ?? "",
            kategori: item["Kategori"] ?? item.kategori ?? "",
            cinsiyet: item["Cinsiyet"] ?? item.cinsiyet ?? "",
            sezon: item["Sezon"] ?? item.sezon ?? "",
            gorsel: item["Ürün Görseli"] ?? item.gorsel ?? ""
        }));

        console.log("Toplam stok satırı:", products.length);

        populateSizeFilter();

    } catch (error) {
        console.error("VERİ HATASI:", error);

        const results = document.getElementById("results");

        if (results) {
            results.innerHTML =
                "<div class='notfound'>❌ Stok verisi okunamadı.</div>";
        }
    }
}


// ======================================================
// GÖRSEL URL'SİNİ TEMİZLE
// ======================================================

function getImageUrl(value) {

    if (!value) {
        return "";
    }

    let url = String(value).trim();

    const markdownMatch = url.match(
        /\]\((https?:\/\/[^)]+)\)/
    );

    if (markdownMatch) {
        url = markdownMatch[1];
    }

    const simpleMarkdown = url.match(
        /^\[?(https?:\/\/[^\]\s]+)\]?$/
    );

    if (simpleMarkdown) {
        url = simpleMarkdown[1];
    }

    url = url.replace(/^["']|["']$/g, "");

    return url.trim();
}


// ======================================================
// ÜRÜN GÖRSELİNİ BUL
// ======================================================

function findProductImage(item) {

    let image = getImageUrl(item.gorsel);

    if (image) {
        return image;
    }

    const stokKodu =
        String(item.stokKodu || "").trim();

    if (stokKodu) {

        for (const product of products) {

            if (
                String(product.stokKodu || "").trim() === stokKodu &&
                product.gorsel
            ) {
                image = getImageUrl(product.gorsel);

                if (image) {
                    return image;
                }
            }
        }
    }

    const urun =
        String(item.urun || "").trim();

    if (urun) {

        for (const product of products) {

            if (
                String(product.urun || "").trim() === urun &&
                product.gorsel
            ) {
                image = getImageUrl(product.gorsel);

                if (image) {
                    return image;
                }
            }
        }
    }

    const barkod =
        String(item.barkod || "").trim();

    if (barkod) {

        for (const product of products) {

            if (
                String(product.barkod || "").trim() === barkod &&
                product.gorsel
            ) {
                image = getImageUrl(product.gorsel);

                if (image) {
                    return image;
                }
            }
        }
    }

    return "";
}


// ======================================================
// ANA MENÜ
// ======================================================

function showMainMenu() {

    document.getElementById("mainMenu").style.display = "block";
    document.getElementById("productSearchArea").style.display = "none";
    document.getElementById("sizeSearchArea").style.display = "none";
}


// ======================================================
// ÜRÜN SORGULAMA
// ======================================================

function showProductSearch() {

    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("productSearchArea").style.display = "block";
    document.getElementById("sizeSearchArea").style.display = "none";
}


// ======================================================
// BEDEN SORGULAMA
// ======================================================

function showSizeSearch() {

    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("productSearchArea").style.display = "none";
    document.getElementById("sizeSearchArea").style.display = "block";

    populateSizeFilter();
}


// ======================================================
// BEDEN LİSTESİ
// ======================================================

function populateSizeFilter() {

    const sizeFilter =
        document.getElementById("sizeFilter");

    if (!sizeFilter || products.length === 0) {
        return;
    }

    const sizes = [];

    products.forEach(item => {

        const size =
            String(item.beden || "").trim();

        const stock =
            Number(item.stok) || 0;

        if (
            size &&
            stock > 0 &&
            !sizes.includes(size)
        ) {
            sizes.push(size);
        }
    });

    sizes.sort((a, b) => {

        const aNum = parseFloat(a);
        const bNum = parseFloat(b);

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        }

        return String(a).localeCompare(
            String(b),
            "tr-TR"
        );
    });

    sizeFilter.innerHTML =
        '<option value="">Beden seçiniz</option>';

    sizes.forEach(size => {

        const option =
            document.createElement("option");

        option.value = size;
        option.textContent = size;

        sizeFilter.appendChild(option);
    });
}


// ======================================================
// ÜRÜN ARAMA
// ======================================================

function searchProducts(text) {

    const results =
        document.getElementById("results");

    if (!results) {
        return;
    }

    text = String(text || "")
        .trim()
        .toLocaleLowerCase("tr-TR");

    if (!text) {
        results.innerHTML = "";
        return;
    }

    const filtered =
        products.filter(item => {

            const barkod =
                String(item.barkod || "")
                    .toLocaleLowerCase("tr-TR");

            const stokKodu =
                String(item.stokKodu || "")
                    .toLocaleLowerCase("tr-TR");

            const urun =
                String(item.urun || "")
                    .toLocaleLowerCase("tr-TR");

            const beden =
                String(item.beden || "")
                    .toLocaleLowerCase("tr-TR");

            const renk =
                String(item.renk || "")
                    .toLocaleLowerCase("tr-TR");

            return (
                barkod.includes(text) ||
                stokKodu.includes(text) ||
                urun.includes(text) ||
                beden.includes(text) ||
                renk.includes(text)
            );
        });

    if (filtered.length === 0) {

        results.innerHTML =
            "<div class='notfound'>❌ Ürün bulunamadı.</div>";

        return;
    }

    const grouped = {};

    filtered.forEach(item => {

        const key =
            String(
                item.stokKodu ||
                item.urun ||
                item.barkod
            );

        if (!grouped[key]) {

            grouped[key] = {

                urun: item.urun || "-",
                stokKodu: item.stokKodu || "-",
                renk: item.renk || "-",
                kategori: item.kategori || "-",
                cinsiyet: item.cinsiyet || "-",
                sezon: item.sezon || "-",
                gorsel: findProductImage(item),

                sizes: []
            };
        }

        grouped[key].sizes.push({

            beden: item.beden || "-",
            stok: Number(item.stok) || 0

        });
    });

    renderProductCards(
        Object.values(grouped),
        results
    );
}


// ======================================================
// BEDEN BAZLI ARAMA
// ======================================================

function searchBySize(selectedSize) {

    const sizeResults =
        document.getElementById("sizeResults");

    const selectedSizeLabel =
        document.getElementById("selectedSizeLabel");

    if (!sizeResults) {
        return;
    }

    selectedSize =
        String(selectedSize || "").trim();

    if (!selectedSize) {

        sizeResults.innerHTML = "";

        if (selectedSizeLabel) {
            selectedSizeLabel.innerHTML = "";
        }

        return;
    }

    if (selectedSizeLabel) {

        selectedSizeLabel.innerHTML =
            "SEÇİLEN BEDEN: <strong>" +
            selectedSize +
            "</strong>";
    }

    const filtered =
        products.filter(item => {

            const beden =
                String(item.beden || "").trim();

            const stok =
                Number(item.stok) || 0;

            return (
                beden === selectedSize &&
                stok > 0
            );
        });

    if (filtered.length === 0) {

        sizeResults.innerHTML =
            "<div class='notfound'>❌ Bu bedende stokta ürün bulunamadı.</div>";

        return;
    }

    const grouped = {};

    filtered.forEach(item => {

        const key =
            String(
                item.stokKodu ||
                item.urun ||
                item.barkod
            );

        if (!grouped[key]) {

            grouped[key] = {

                urun: item.urun || "-",
                stokKodu: item.stokKodu || "-",
                renk: item.renk || "-",
                kategori: item.kategori || "-",
                cinsiyet: item.cinsiyet || "-",
                sezon: item.sezon || "-",
                gorsel: findProductImage(item),

                sizes: [
                    {
                        beden: item.beden || selectedSize,
                        stok: Number(item.stok) || 0
                    }
                ]
            };
        }
    });

    renderProductCards(
        Object.values(grouped),
        sizeResults
    );
}


// ======================================================
// GÖRSEL HATA KONTROLÜ
// ======================================================

function imageError(img) {

    console.warn(
        "Görsel yüklenemedi:",
        img.src
    );

    img.style.display = "none";
}


// ======================================================
// ÜRÜN KARTLARI
// ======================================================

function renderProductCards(productList, container) {

    let html = "";

    productList.forEach(product => {

        product.sizes.sort((a, b) => {

            const aNum = parseFloat(a.beden);
            const bNum = parseFloat(b.beden);

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }

            return String(a.beden)
                .localeCompare(
                    String(b.beden),
                    "tr-TR"
                );
        });

        let sizeHTML = "";

        product.sizes.forEach(size => {

            let stockClass = "";

            if (size.stok === 0) {
                stockClass = "out-of-stock";
            } else if (size.stok <= 2) {
                stockClass = "low-stock";
            }

            sizeHTML +=

                '<div class="size-box ' +
                stockClass +
                '">' +

                '<span class="size">' +
                size.beden +
                '</span>' +

                '<span class="quantity">' +
                size.stok +
                '</span>' +

                '</div>';
        });

        let imageHTML = "";

        const imageUrl =
            getImageUrl(product.gorsel);

        if (imageUrl) {

            imageHTML =

                '<div class="product-image">' +

                '<img ' +

                'src="' +
                imageUrl +
                '" ' +

                'alt="' +
                String(product.urun || "PUMA Ürün")
                    .replace(/"/g, "&quot;") +
                '" ' +

                'loading="lazy" ' +

                'referrerpolicy="no-referrer" ' +

                'onerror="imageError(this)"' +

                '>';
        }

        html +=

            '<div class="product-card">' +

                imageHTML +

                '<div class="product-name">' +
                product.urun +
                '</div>' +

                '<div>' +
                '<strong>Stok Kodu:</strong> ' +
                product.stokKodu +
                '</div>' +

                '<div>' +
                '<strong>Renk:</strong> ' +
                product.renk +
                '</div>' +

                '<div>' +
                '<strong>Kategori:</strong> ' +
                product.kategori +
                '</div>' +

                '<div>' +
                '<strong>Cinsiyet:</strong> ' +
                product.cinsiyet +
                '</div>' +

                '<div>' +
                '<strong>Sezon:</strong> ' +
                product.sezon +
                '</div>' +

                '<div class="size-title">' +
                'BEDEN / STOK' +
                '</div>' +

                '<div class="sizes">' +
                sizeHTML +
                '</div>' +

            '</div>';
    });

    container.innerHTML = html;
}


// ======================================================
// SAYFA AÇILDIĞINDA
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadProducts();

        const input =
            document.querySelector("#searchInput") ||
            document.querySelector("#search") ||
            document.querySelector("input");

        if (!input) {

            console.error(
                "Arama kutusu bulunamadı."
            );

            return;
        }

        let timer;

        input.addEventListener(
            "input",
            function () {

                clearTimeout(timer);

                const value = this.value;

                timer = setTimeout(
                    function () {

                        searchProducts(value);

                    },
                    100
                );
            }
        );
    }
);
```
