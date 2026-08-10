let products = [];

// ======================================================
// VERİLERİ YÜKLE
// ======================================================

async function loadProducts() {
    try {

        const response = await fetch(
            "./data.json?v=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("data.json bulunamadı");
        }

        const rawData = await response.json();

        products = rawData.map(item => ({

            barkod:
                String(
                    item["BARKOD"] ?? ""
                ).trim(),

            stokKodu:
                String(
                    item["STOK KODU"] ?? ""
                ).trim(),

            urun:
                String(
                    item["PRODUCTNAME"] ?? ""
                ).trim(),

            beden:
                String(
                    item["BEDEN NO"] ?? ""
                ).trim(),

            stok:
                Number(
                    item["STOK ADEDİ"] ?? 0
                ),

            cinsiyet:
                String(
                    item["CİNSİYET"] ?? ""
                ).trim(),

            kategori:
                String(
                    item["PUMA KATEGORİ"] ?? ""
                ).trim(),

            sezon:
                String(
                    item["SEZON"] ?? ""
                ).trim(),

            gorsel:
                String(
                    item["ÜRÜN RESMİ EXCEL"] ?? ""
                ).trim()
        }));


        console.log(
            "Ürün sayısı:",
            products.length
        );


        const kontrol =
            products.filter(
                item =>
                    item.stokKodu === "63663235"
            );


        console.log(
            "63663235 kontrol:",
            kontrol
        );


        populateSizeFilter();


    } catch (error) {

        console.error(
            "VERİ HATASI:",
            error
        );

    }
}


// ======================================================
// ANA MENÜ
// ======================================================

function showMainMenu() {

    document.getElementById(
        "mainMenu"
    ).style.display = "flex";

    document.getElementById(
        "productSearchArea"
    ).style.display = "none";

    document.getElementById(
        "sizeSearchArea"
    ).style.display = "none";
}


// ======================================================
// ÜRÜN SORGULAMA
// ======================================================

function showProductSearch() {

    document.getElementById(
        "mainMenu"
    ).style.display = "none";

    document.getElementById(
        "productSearchArea"
    ).style.display = "block";

    document.getElementById(
        "sizeSearchArea"
    ).style.display = "none";

    const input =
        document.getElementById(
            "searchInput"
        );

    if (input) {

        input.value = "";

        input.focus();
    }

    document.getElementById(
        "results"
    ).innerHTML = "";
}


// ======================================================
// BEDEN SORGULAMA
// ======================================================

function showSizeSearch() {

    document.getElementById(
        "mainMenu"
    ).style.display = "none";

    document.getElementById(
        "productSearchArea"
    ).style.display = "none";

    document.getElementById(
        "sizeSearchArea"
    ).style.display = "block";

    populateSizeFilter();
}


// ======================================================
// BEDEN LİSTESİ
// ======================================================

function populateSizeFilter() {

    const select =
        document.getElementById(
            "sizeFilter"
        );

    if (!select) return;


    const sizes = new Set();


    products.forEach(item => {

        if (
            item.beden &&
            item.stok > 0
        ) {

            sizes.add(
                item.beden
            );

        }

    });


    const sorted =
        Array.from(sizes).sort(
            (a, b) => {

                const aNum =
                    parseFloat(a);

                const bNum =
                    parseFloat(b);


                if (
                    !isNaN(aNum) &&
                    !isNaN(bNum)
                ) {

                    return aNum - bNum;

                }


                return String(a)
                    .localeCompare(
                        String(b),
                        "tr-TR"
                    );
            }
        );


    select.innerHTML =
        '<option value="">Beden seçiniz</option>';


    sorted.forEach(size => {

        const option =
            document.createElement(
                "option"
            );

        option.value = size;
        option.textContent = size;

        select.appendChild(
            option
        );

    });
}


// ======================================================
// ÜRÜN ARAMA
// ======================================================

function searchProducts(text) {

    const results =
        document.getElementById(
            "results"
        );

    if (!results) return;


    const search =
        String(text || "")
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );


    if (!search) {

        results.innerHTML = "";
        return;

    }


    console.log(
        "Arama:",
        search
    );


    const filtered =
        products.filter(item => {


            const barkod =
                item.barkod
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


            const stokKodu =
                item.stokKodu
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


            const urun =
                item.urun
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


            const beden =
                item.beden
                    .toLocaleLowerCase(
                        "tr-TR"
                    );


            return (

                barkod.includes(search) ||

                stokKodu.includes(search) ||

                urun.includes(search) ||

                beden.includes(search)

            );

        });


    console.log(
        "Bulunan:",
        filtered.length
    );


    if (
        filtered.length === 0
    ) {

        results.innerHTML =
            "<div class='notfound'>" +
            "❌ Ürün bulunamadı." +
            "</div>";

        return;

    }


    renderProducts(
        filtered,
        results
    );
}


// ======================================================
// BEDEN ARAMA
// ======================================================

function searchBySize(size) {

    const results =
        document.getElementById(
            "sizeResults"
        );

    if (!results) return;


    size =
        String(size || "")
            .trim();


    if (!size) {

        results.innerHTML = "";
        return;

    }


    const filtered =
        products.filter(item => {

            return (

                item.beden === size &&

                item.stok > 0

            );

        });


    if (
        filtered.length === 0
    ) {

        results.innerHTML =
            "<div class='notfound'>" +
            "❌ Bu bedende stok bulunamadı." +
            "</div>";

        return;

    }


    renderProducts(
        filtered,
        results
    );
}


// ======================================================
// ÜRÜNLERİ GÖSTER
// ======================================================

function renderProducts(
    list,
    container
) {

    const grouped = {};


    list.forEach(item => {

        const key =
            item.stokKodu ||
            item.urun ||
            item.barkod;


        if (!grouped[key]) {

            grouped[key] = {

                urun:
                    item.urun || "-",

                stokKodu:
                    item.stokKodu || "-",

                kategori:
                    item.kategori || "-",

                cinsiyet:
                    item.cinsiyet || "-",

                sezon:
                    item.sezon || "-",

                gorsel:
                    item.gorsel || "",

                sizes: []

            };

        }


        grouped[key].sizes.push({

            beden:
                item.beden || "-",

            stok:
                item.stok

        });

    });


    let html = "";


    Object.values(grouped)
        .forEach(product => {


            let sizeHTML = "";


            product.sizes
                .sort((a, b) => {

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

                })
                .forEach(size => {


                    let stockClass = "";


                    if (
                        size.stok === 0
                    ) {

                        stockClass =
                            "out-of-stock";

                    }
                    else if (
                        size.stok <= 2
                    ) {

                        stockClass =
                            "low-stock";

                    }


                    sizeHTML +=

                        '<div class="size-box ' +
                        stockClass +
                        '">' +

                        '<span class="size">' +
                        escapeHTML(
                            size.beden
                        ) +
                        '</span>' +

                        '<span class="quantity">' +
                        size.stok +
                        '</span>' +

                        '</div>';

                });


            html +=

                '<div class="product-card">' +

                '<div class="product-name">' +
                escapeHTML(
                    product.urun
                ) +
                '</div>' +

                '<div>' +
                '<strong>Stok Kodu:</strong> ' +
                escapeHTML(
                    product.stokKodu
                ) +
                '</div>' +

                '<div>' +
                '<strong>Kategori:</strong> ' +
                escapeHTML(
                    product.kategori
                ) +
                '</div>' +

                '<div>' +
                '<strong>Cinsiyet:</strong> ' +
                escapeHTML(
                    product.cinsiyet
                ) +
                '</div>' +

                '<div>' +
                '<strong>Sezon:</strong> ' +
                escapeHTML(
                    product.sezon
                ) +
                '</div>' +

                '<div class="size-title">' +
                'BEDEN / STOK' +
                '</div>' +

                '<div class="sizes">' +
                sizeHTML +
                '</div>' +

                '</div>';

        });


    container.innerHTML =
        html;
}


// ======================================================
// HTML GÜVENLİĞİ
// ======================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ======================================================
// SAYFA AÇILIŞI
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {


        loadProducts();


        const input =
            document.getElementById(
                "searchInput"
            );


        if (input) {

            let timer;


            input.addEventListener(
                "input",
                function () {

                    clearTimeout(timer);


                    timer =
                        setTimeout(
                            () => {

                                searchProducts(
                                    input.value
                                );

                            },
                            100
                        );

                }
            );

        }


        const sizeFilter =
            document.getElementById(
                "sizeFilter"
            );


        if (sizeFilter) {

            sizeFilter.addEventListener(
                "change",
                function () {

                    searchBySize(
                        this.value
                    );

                }
            );

        }

    }
);
