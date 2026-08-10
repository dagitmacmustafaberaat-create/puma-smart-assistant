let products = [];

/* ======================================================
   VERİ ALANLARI
====================================================== */

function getValue(item, keys) {
    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) {
            return String(item[key]).trim();
        }
    }
    return "";
}

function getBarkod(item) {
    return getValue(item, ["BARKOD", "Barkod"]);
}

function getStokKodu(item) {
    return getValue(item, ["STOK KODU", "Stok Kodu", "Ürün Kodu"]);
}

function getUrun(item) {
    return getValue(item, ["PRODUCTNAME", "ProductName", "Ürün Adı"]);
}

function getBeden(item) {
    return getValue(item, ["BEDEN NO", "Beden No"]);
}

function getStok(item) {
    const value =
        item["STOK ADEDİ"] ??
        item["Stok Adedi"] ??
        0;

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}

function getCinsiyet(item) {
    return getValue(item, ["CİNSİYET", "Cinsiyet"]);
}

function getKategori(item) {
    return getValue(item, ["PUMA KATEGORİ", "Kategori"]);
}

function getSezon(item) {
    return getValue(item, ["SEZON", "Sezon"]);
}

function getGorsel(item) {
    return getValue(item, [
        "ÜRÜN RESMİ EXCEL",
        "Ürün Görseli"
    ]);
}


/* ======================================================
   VERİ YÜKLE
====================================================== */

async function loadProducts() {

    try {

        const response = await fetch(
            "./data.json?v=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "data.json HTTP " +
                response.status
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "data.json bir liste değil."
            );
        }

        products = data;

        console.log(
            "PUMA SMART ASSISTANT"
        );

        console.log(
            "Ürün sayısı:",
            products.length
        );

        const test =
            products.filter(function(item) {

                return (
                    getStokKodu(item) ===
                    "63663235"
                );

            });

        console.log(
            "63663235 kayıtları:",
            test
        );

        populateSizeFilter();

    }

    catch (error) {

        console.error(
            "DATA HATASI:",
            error
        );

        const results =
            document.getElementById("results");

        if (results) {

            results.innerHTML =
                "<div class='notfound'>" +
                "❌ Stok verisi okunamadı.<br><br>" +
                "data.json kontrol edilmeli." +
                "</div>";
        }
    }
}


/* ======================================================
   NORMALİZE
====================================================== */

function normalize(value) {

    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("tr-TR")
        .replace(/\s+/g, "");
}


/* ======================================================
   ANA MENÜ
====================================================== */

function showMainMenu() {

    const mainMenu =
        document.getElementById("mainMenu");

    const productSearchArea =
        document.getElementById(
            "productSearchArea"
        );

    const sizeSearchArea =
        document.getElementById(
            "sizeSearchArea"
        );

    const results =
        document.getElementById("results");

    const sizeResults =
        document.getElementById(
            "sizeResults"
        );

    if (mainMenu) {
        mainMenu.style.display = "flex";
    }

    if (productSearchArea) {
        productSearchArea.style.display =
            "none";
    }

    if (sizeSearchArea) {
        sizeSearchArea.style.display =
            "none";
    }

    if (results) {
        results.innerHTML = "";
    }

    if (sizeResults) {
        sizeResults.innerHTML = "";
    }
}


/* ======================================================
   ÜRÜN SORGULAMA
====================================================== */

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

        setTimeout(function() {

            input.focus();

        }, 100);
    }

    const results =
        document.getElementById(
            "results"
        );

    if (results) {
        results.innerHTML = "";
    }
}


/* ======================================================
   BEDEN SORGULAMA
====================================================== */

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


/* ======================================================
   BEDENLER
====================================================== */

function populateSizeFilter() {

    const select =
        document.getElementById(
            "sizeFilter"
        );

    if (!select) {
        return;
    }

    const sizes =
        new Set();

    products.forEach(function(item) {

        const beden =
            getBeden(item);

        const stok =
            getStok(item);

        if (
            beden &&
            stok > 0
        ) {
            sizes.add(beden);
        }
    });

    const sorted =
        Array.from(sizes).sort(
            function(a, b) {

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

                return a.localeCompare(
                    b,
                    "tr-TR"
                );
            }
        );

    select.innerHTML =
        '<option value="">' +
        'Beden seçiniz' +
        '</option>';

    sorted.forEach(function(size) {

        const option =
            document.createElement(
                "option"
            );

        option.value = size;
        option.textContent = size;

        select.appendChild(option);
    });
}


/* ======================================================
   ÜRÜN ARAMA
====================================================== */

function searchProducts(text) {

    const results =
        document.getElementById(
            "results"
        );

    if (!results) {
        return;
    }

    const search =
        normalize(text);

    if (!search) {

        results.innerHTML = "";

        return;
    }

    console.log(
        "ARANAN:",
        search
    );


    const filtered =
        products.filter(function(item) {

            const barkod =
                normalize(
                    getBarkod(item)
                );

            const stokKodu =
                normalize(
                    getStokKodu(item)
                );

            const urun =
                normalize(
                    getUrun(item)
                );

            const beden =
                normalize(
                    getBeden(item)
                );

            const cinsiyet =
                normalize(
                    getCinsiyet(item)
                );

            const kategori =
                normalize(
                    getKategori(item)
                );

            const sezon =
                normalize(
                    getSezon(item)
                );


            return (

                barkod.includes(search) ||

                stokKodu.includes(search) ||

                urun.includes(search) ||

                beden.includes(search) ||

                cinsiyet.includes(search) ||

                kategori.includes(search) ||

                sezon.includes(search)

            );

        });


    console.log(
        "ARAMA SONUCU:",
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


/* ======================================================
   BEDEN ARAMA
====================================================== */

function searchBySize(
    selectedSize
) {

    const results =
        document.getElementById(
            "sizeResults"
        );

    if (!results) {
        return;
    }

    const size =
        normalize(selectedSize);

    if (!size) {

        results.innerHTML = "";

        return;
    }


    const filtered =
        products.filter(function(item) {

            return (

                normalize(
                    getBeden(item)
                ) === size &&

                getStok(item) > 0

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


/* ======================================================
   ÜRÜNLERİ GÖSTER
====================================================== */

function renderProducts(
    list,
    container
) {

    const grouped = {};


    list.forEach(function(item) {

        const stokKodu =
            getStokKodu(item);

        const barkod =
            getBarkod(item);

        const urun =
            getUrun(item);

        const key =
            stokKodu ||
            barkod ||
            urun;


        if (!grouped[key]) {

            grouped[key] = {

                urun:
                    urun || "-",

                stokKodu:
                    stokKodu || "-",

                barkod:
                    barkod || "-",

                kategori:
                    getKategori(item) || "-",

                cinsiyet:
                    getCinsiyet(item) || "-",

                sezon:
                    getSezon(item) || "-",

                gorsel:
                    getGorsel(item),

                sizes: []

            };
        }


        grouped[key].sizes.push({

            beden:
                getBeden(item) || "-",

            stok:
                getStok(item)

        });

    });


    let html = "";


    Object.values(
        grouped
    ).forEach(function(product) {


        product.sizes.sort(
            function(a, b) {

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

                return String(
                    a.beden
                ).localeCompare(
                    String(b.beden),
                    "tr-TR"
                );

            }
        );


        let sizeHTML = "";


        product.sizes.forEach(
            function(size) {

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

            }
        );


        let imageHTML = "";


        const image =
            getGorsel(product);


        if (
            image &&
            (
                image.startsWith(
                    "http://"
                ) ||
                image.startsWith(
                    "https://"
                )
            )
        ) {

            imageHTML =

                '<div class="product-image">' +

                '<img src="' +
                escapeHTML(image) +
                '" ' +

                'alt="' +
                escapeHTML(
                    product.urun
                ) +
                '" ' +

                'loading="lazy" ' +

                'onerror="' +
                "this.parentElement.style.display='none'" +
                '">' +

                '</div>';
        }


        html +=

            '<div class="product-card">' +

            imageHTML +

            '<div class="product-name">' +
            escapeHTML(
                product.urun
            ) +
            '</div>' +

            '<div>' +
            '<strong>Ürün Kodu:</strong> ' +
            escapeHTML(
                product.stokKodu
            ) +
            '</div>' +

            '<div>' +
            '<strong>Barkod:</strong> ' +
            escapeHTML(
                product.barkod
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


/* ======================================================
   HTML GÜVENLİĞİ
====================================================== */

function escapeHTML(value) {

    return String(value ?? "")
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


/* ======================================================
   SAYFA AÇILIŞI
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadProducts();


        const input =
            document.getElementById(
                "searchInput"
            );


        if (input) {

            let timer;


            input.addEventListener(
                "input",
                function() {

                    clearTimeout(timer);


                    const value =
                        input.value;


                    timer =
                        setTimeout(
                            function() {

                                searchProducts(
                                    value
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
                function() {

                    searchBySize(
                        this.value
                    );

                }
            );

        }

    }
);
