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

        products = await response.json();

        console.log("Toplam ürün:", products.length);

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
// GÖRSEL YOLUNU OLUŞTUR
// ======================================================

function findProductImage(item) {

    const stokKodu = String(
        item.stokKodu ||
        item.barkod ||
        ""
    ).trim();

    const gorsel = String(
        item.gorsel ||
        ""
    ).trim();

    // data.json içinde gerçek bir görsel URL'si varsa kullan
    if (
        gorsel &&
        (
            gorsel.startsWith("http://") ||
            gorsel.startsWith("https://") ||
            gorsel.startsWith("./") ||
            gorsel.startsWith("/")
        )
    ) {
        return gorsel;
    }

    // images klasöründeki dosyaları stok koduna göre ara
    if (stokKodu) {

        return "./images/" + stokKodu + ".png";
    }

    return "";
}

// ======================================================
// GÖRSEL HATA KONTROLÜ
// PNG yoksa JPG/JPEG denenecek
// ======================================================

function createImageHTML(product) {

    const stokKodu = String(
        product.stokKodu || ""
    ).trim();

    if (!stokKodu) {
        return "";
    }

    const png =
        "./images/" + stokKodu + ".png";

    const jpg =
        "./images/" + stokKodu + ".jpg";

    const jpeg =
        "./images/" + stokKodu + ".jpeg";

    return `
        <div class="product-image">
            <img
                src="${png}"
                alt="${product.urun || "PUMA Ürün"}"
                loading="lazy"
                onerror="
                    if (this.dataset.try === 'jpg') {
                        this.dataset.try = 'jpeg';
                        this.src = '${jpeg}';
                    }
                    else if (this.dataset.try === 'jpeg') {
                        this.parentElement.style.display = 'none';
                    }
                    else {
                        this.dataset.try = 'jpg';
                        this.src = '${jpg}';
                    }
                "
            >
        </div>
    `;
}

// ======================================================
// ANA MENÜ
// ======================================================

function showMainMenu() {

    const mainMenu =
        document.getElementById("mainMenu");

    const productSearchArea =
        document.getElementById("productSearchArea");

    const sizeSearchArea =
        document.getElementById("sizeSearchArea");

    if (mainMenu) {
        mainMenu.style.display = "block";
    }

    if (productSearchArea) {
        productSearchArea.style.display = "none";
    }

    if (sizeSearchArea) {
        sizeSearchArea.style.display = "none";
    }
}

// ======================================================
// ÜRÜN SORGULAMA
// ======================================================

function showProductSearch() {

    const mainMenu =
        document.getElementById("mainMenu");

    const productSearchArea =
        document.getElementById("productSearchArea");

    const sizeSearchArea =
        document.getElementById("sizeSearchArea");

    if (mainMenu) {
        mainMenu.style.display = "none";
    }

    if (productSearchArea) {
        productSearchArea.style.display = "block";
    }

    if (sizeSearchArea) {
        sizeSearchArea.style.display = "none";
    }

    const input =
        document.getElementById("searchInput");

    if (input) {
        setTimeout(function () {
            input.focus();
        }, 100);
    }
}

// ======================================================
// BEDEN SORGULAMA
// ======================================================

function showSizeSearch() {

    const mainMenu =
        document.getElementById("mainMenu");

    const productSearchArea =
        document.getElementById("productSearchArea");

    const sizeSearchArea =
        document.getElementById("sizeSearchArea");

    if (mainMenu) {
        mainMenu.style.display = "none";
    }

    if (productSearchArea) {
        productSearchArea.style.display = "none";
    }

    if (sizeSearchArea) {
        sizeSearchArea.style.display = "block";
    }
}

// ======================================================
// BEDEN ARAMASI
// ======================================================

function searchBySize(selectedSize) {

    console.log(
        "Beden araması:",
        selectedSize
    );
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
        products.filter(function (item) {

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

    filtered.forEach(function (item) {

        const key =
            String(
                item.stokKodu ||
                item.urun ||
                item.barkod
            );

        if (!grouped[key]) {

            grouped[key] = {

                urun:
                    item.urun || "-",

                stokKodu:
                    item.stokKodu || item.barkod || "-",

                renk:
                    item.renk || "-",

                kategori:
                    item.kategori || "-",

                cinsiyet:
                    item.cinsiyet || "-",

                sezon:
                    item.sezon || "-",

                sizes: []
            };
        }

        grouped[key].sizes.push({

            beden:
                item.beden || "-",

            stok:
                Number(item.stok) || 0
        });
    });

    renderProductCards(
        Object.values(grouped),
        results
    );
}

// ======================================================
// ÜRÜN KARTLARI
// ======================================================

function renderProductCards(
    productList,
    container
) {

    let html = "";

    productList.forEach(function (product) {

        product.sizes.sort(function (a, b) {

            const aNum =
                parseFloat(a.beden);

            const bNum =
                parseFloat(b.beden);

            if (
                !isNaN(aNum) &&
                !isNaN(bNum)
            ) {
                return aNum - bNum;
            }

            return String(a.beden)
                .localeCompare(
                    String(b.beden),
                    "tr-TR"
                );
        });

        let sizeHTML = "";

        product.sizes.forEach(function (size) {

            let stockClass = "";

            if (size.stok === 0) {

                stockClass =
                    "out-of-stock";

            } else if (size.stok <= 2) {

                stockClass =
                    "low-stock";
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

        // ==================================================
        // GÖRSEL
        // ==================================================

        const imageHTML =
            createImageHTML(product);

        // ==================================================
        // KART
        // ==================================================

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
            document.getElementById("searchInput");

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

                const value =
                    this.value;

                timer =
                    setTimeout(
                        function () {

                            searchProducts(
                                value
                            );

                        },
                        100
                    );
            }
        );

    }
);
```
