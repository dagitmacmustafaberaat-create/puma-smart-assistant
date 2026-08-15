let products = [];


/* ======================================================
   VERİ ALANLARI
====================================================== */

function getBarkod(item) {
    return String(
        item["BARKOD"] ??
        item["Barkod"] ??
        item["barcode"] ??
        item["barkod"] ??
        ""
    ).trim();
}


function getStokKodu(item) {
    return String(
        item["PRODUCTCODE"] ??
        item["productCode"] ??
        item["urunKodu"] ??
        item["URUN_KODU"] ??
        item["Ürün kodu"] ??
        item["Ürün Kodu"] ??
        item["STOK KODU"] ??
        item["code"] ??
        ""
    ).trim();
}


function getUrun(item) {
    return String(
        item["PRODUCTNAME"] ??
        item["productName"] ??
        item["Ürün Adı"] ??
        ""
    ).trim();
}


function getBeden(item) {
    return String(
        item["BEDEN NO"] ??
        item["BEDEN_NO"] ??
        item["Beden No"] ??
        item["bedenNo"] ??
        item["size"] ??
        ""
    ).trim();
}


function getStok(item) {

    const value = Number(
        item["STOK ADEDİ"] ??
        item["STOK_ADEDI"] ??
        item["Stok Adedi"] ??
        item["stokAdedi"] ??
        item["stock"] ??
        item["stok"] ??
        0
    );

    return Number.isFinite(value)
        ? value
        : 0;
}


function getCinsiyet(item) {
    return String(
        item["CİNSİYET"] ??
        item["Cinsiyet"] ??
        item["gender"] ??
        ""
    ).trim();
}


function getKategori(item) {
    return String(
        item["PUMA KATEGORİ"] ??
        item["PUMA_KATEGORI"] ??
        item["Kategori"] ??
        item["category"] ??
        ""
    ).trim();
}


function getSezon(item) {
    return String(
        item["SEZON"] ??
        item["Sezon"] ??
        item["season"] ??
        ""
    ).trim();
}


/* ======================================================
   GÖRSEL ALANI
====================================================== */

function getGorsel(item) {

    let value =
        item["ÜRÜN RESMİ EXCEL"] ??
        item["URUN_RESIMI_EXCEL"] ??
        item["Ürün Görseli"] ??
        item["image"] ??
        "";

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    let url = String(value).trim();

    const markdownMatch =
        url.match(
            /\((https?:\/\/[^)]+)\)/
        );

    if (markdownMatch) {
        url = markdownMatch[1];
    }

    url = url
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .replace(/\\/g, "")
        .trim();

    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    return "";
}


/* ======================================================
   VERİYİ YÜKLE
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
                "data.json yüklenemedi. HTTP: " +
                response.status
            );
        }

        const data =
            await response.json();

        if (!Array.isArray(data)) {

            throw new Error(
                "data.json bir liste (array) değil."
            );
        }

        products = data;

        console.log(
            "===================================="
        );

        console.log(
            "PUMA SMART ASSISTANT"
        );

        console.log(
            "Toplam kayıt:",
            products.length
        );

        const imageCount =
            products.filter(function (item) {
                return getGorsel(item) !== "";
            }).length;

        console.log(
            "Görsel URL'si bulunan kayıt:",
            imageCount
        );

        console.log(
            "===================================="
        );

        populateSizeFilter();

    }

    catch (error) {

        console.error(
            "DATA.JSON HATASI:",
            error
        );

        const results =
            document.getElementById(
                "results"
            );

        if (results) {

            results.innerHTML =
                "<div class='notfound'>" +
                "❌ Stok verisi okunamadı.<br><br>" +
                escapeHTML(error.message) +
                "</div>";
        }
    }
}


/* ======================================================
   ANA MENÜ
====================================================== */

function showMainMenu() {

    const mainMenu =
        document.getElementById(
            "mainMenu"
        );

    const productSearchArea =
        document.getElementById(
            "productSearchArea"
        );

    const sizeSearchArea =
        document.getElementById(
            "sizeSearchArea"
        );

    const results =
        document.getElementById(
            "results"
        );

    const sizeResults =
        document.getElementById(
            "sizeResults"
        );

    if (mainMenu) {
        mainMenu.style.display = "flex";
    }

    if (productSearchArea) {
        productSearchArea.style.display = "none";
    }

    if (sizeSearchArea) {
        sizeSearchArea.style.display = "none";
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

    const mainMenu =
        document.getElementById(
            "mainMenu"
        );

    const productSearchArea =
        document.getElementById(
            "productSearchArea"
        );

    const sizeSearchArea =
        document.getElementById(
            "sizeSearchArea"
        );

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
        document.getElementById(
            "searchInput"
        );

    if (input) {

        input.value = "";

        setTimeout(
            function () {
                input.focus();
            },
            100
        );
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

    const mainMenu =
        document.getElementById(
            "mainMenu"
        );

    const productSearchArea =
        document.getElementById(
            "productSearchArea"
        );

    const sizeSearchArea =
        document.getElementById(
            "sizeSearchArea"
        );

    if (mainMenu) {
        mainMenu.style.display = "none";
    }

    if (productSearchArea) {
        productSearchArea.style.display = "none";
    }

    if (sizeSearchArea) {
        sizeSearchArea.style.display = "block";
    }

    populateSizeFilter();
}


/* ======================================================
   BEDENLERİ DOLDUR
====================================================== */

function populateSizeFilter() {

    const select =
        document.getElementById(
            "sizeFilter"
        );

    if (!select) {
        return;
    }

    const sizes = new Set();

    products.forEach(
        function (item) {

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
        }
    );

    const sortedSizes =
        Array.from(sizes).sort(
            function (a, b) {

                const aNum =
                    parseFloat(
                        String(a).replace(",", ".")
                    );

                const bNum =
                    parseFloat(
                        String(b).replace(",", ".")
                    );

                if (
                    !isNaN(aNum) &&
                    !isNaN(bNum)
                ) {
                    return aNum - bNum;
                }

                return String(a).localeCompare(
                    String(b),
                    "tr-TR"
                );
            }
        );

    select.innerHTML =
        '<option value="">Beden seçiniz</option>';

    sortedSizes.forEach(
        function (size) {

            const option =
                document.createElement(
                    "option"
                );

            option.value = size;
            option.textContent = size;

            select.appendChild(option);
        }
    );
}


/* ======================================================
   BEDEN ARAMA
====================================================== */

function searchBySize(selectedSize) {

    const results =
        document.getElementById(
            "sizeResults"
        );

    if (!results) {
        return;
    }

    const size =
        String(selectedSize || "")
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );

    if (!size) {

        results.innerHTML = "";
        return;
    }

    const filtered =
        products.filter(
            function (item) {

                const beden =
                    getBeden(item)
                        .toLocaleLowerCase(
                            "tr-TR"
                        );

                return (
                    beden === size &&
                    getStok(item) > 0
                );
            }
        );

    console.log(
        "Beden araması:",
        selectedSize,
        "Sonuç:",
        filtered.length
    );

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
   ÜRÜN ARAMA
====================================================== */

function normalizeSearch(value) {

    return String(value || "")
        .toLocaleLowerCase("tr-TR")
        .trim()
        .replace(/\s+/g, "");
}


function normalizeCode(value) {

    return String(value || "")
        .toLocaleLowerCase("tr-TR")
        .trim()
        .replace(/[\s\-_.\/]/g, "");
}


function searchProducts(text) {

    const results =
        document.getElementById(
            "results"
        );

    if (!results) {
        return;
    }

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

    const searchNormal =
        normalizeSearch(search);

    const searchCode =
        normalizeCode(search);

    const filtered =
        products.filter(
            function (item) {

                const barkod =
                    getBarkod(item)
                        .toLocaleLowerCase(
                            "tr-TR"
                        );

                const stokKodu =
                    getStokKodu(item)
                        .toLocaleLowerCase(
                            "tr-TR"
                        );

                const urun =
                    getUrun(item)
                        .toLocaleLowerCase(
                            "tr-TR"
                        );

                const beden =
                    getBeden(item)
                        .toLocaleLowerCase(
                            "tr-TR"
                        );

                const cinsiyet =
                    getCinsiyet(item)
                        .toLocaleLowerCase(
                            "tr-TR"
                        );

                const kategori =
                    getKategori(item)
                        .toLocaleLowerCase(
                            "tr-TR"
                        );

                const sezon =
                    getSezon(item)
                        .toLocaleLowerCase(
                            "tr-TR"
                        );

                const barkodNormal =
                    normalizeCode(barkod);

                const stokKoduNormal =
                    normalizeCode(stokKodu);

                const urunNormal =
                    normalizeSearch(urun);

                const bedenNormal =
                    normalizeSearch(beden);

                const cinsiyetNormal =
                    normalizeSearch(cinsiyet);

                const kategoriNormal =
                    normalizeSearch(kategori);

                const sezonNormal =
                    normalizeSearch(sezon);

                return (

                    /* BARKOD */
                    barkod.includes(search) ||

                    barkodNormal.includes(
                        searchCode
                    ) ||

                    /* ÜRÜN KODU */
                    stokKodu.includes(search) ||

                    stokKoduNormal.includes(
                        searchCode
                    ) ||

                    /* ÜRÜN ADI */
                    urun.includes(search) ||

                    urunNormal.includes(
                        searchNormal
                    ) ||

                    /* BEDEN */
                    beden.includes(search) ||

                    bedenNormal.includes(
                        searchNormal
                    ) ||

                    /* CİNSİYET */
                    cinsiyet.includes(search) ||

                    cinsiyetNormal.includes(
                        searchNormal
                    ) ||

                    /* KATEGORİ */
                    kategori.includes(search) ||

                    kategoriNormal.includes(
                        searchNormal
                    ) ||

                    /* SEZON */
                    sezon.includes(search) ||

                    sezonNormal.includes(
                        searchNormal
                    )
                );
            }
        );

    console.log(
        "ARAMA:",
        search
    );

    console.log(
        "SONUÇ:",
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
   ÜRÜNLERİ GRUPLA VE GÖSTER
====================================================== */

function renderProducts(
    list,
    container
) {

    const grouped = {};

    list.forEach(
        function (item) {

            const stokKodu =
                getStokKodu(item);

            const barkod =
                getBarkod(item);

            const urun =
                getUrun(item);

            const image =
                getGorsel(item);

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
                        image || "",

                    sizes: []
                };

            } else {

                if (
                    !grouped[key].gorsel &&
                    image
                ) {
                    grouped[key].gorsel =
                        image;
                }
            }

            grouped[key].sizes.push({

                beden:
                    getBeden(item) || "-",

                stok:
                    getStok(item)

            });

        }
    );


    let html = "";


    Object.values(grouped).forEach(
        function (product) {

            /* Aynı beden birden fazla satırda varsa stokları birleştir */
            const sizeMap = {};

            product.sizes.forEach(
                function (size) {

                    const key =
                        String(size.beden)
                            .trim()
                            .toLocaleLowerCase(
                                "tr-TR"
                            );

                    if (!sizeMap[key]) {

                        sizeMap[key] = {
                            beden: size.beden,
                            stok: 0
                        };

                    }

                    sizeMap[key].stok +=
                        Number(size.stok) || 0;
                }
            );

            product.sizes =
                Object.values(sizeMap);


            /* Bedenleri sırala */
            product.sizes.sort(
                function (a, b) {

                    const aNum =
                        parseFloat(
                            String(a.beden)
                                .replace(",", ".")
                        );

                    const bNum =
                        parseFloat(
                            String(b.beden)
                                .replace(",", ".")
                        );

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
                function (size) {

                    let stockClass = "";

                    if (
                        size.stok === 0
                    ) {

                        stockClass =
                            "out-of-stock";

                    } else if (
                        size.stok <= 2
                    ) {

                        stockClass =
                            "low-stock";
                    }


                    sizeHTML += `
                        <div class="size-box ${stockClass}">
                            <span class="size">
                                ${escapeHTML(size.beden)}
                            </span>

                            <span class="quantity">
                                ${size.stok}
                            </span>
                        </div>
                    `;
                }
            );


            const image =
                findImage(product);


            html += `
                <div class="product-card">

                    ${
                        image
                        ?
                        `
                        <div class="product-image">

                            <img
                                src="${escapeHTML(image)}"
                                alt="${escapeHTML(product.urun)}"
                                loading="lazy"
                                referrerpolicy="no-referrer"
                                data-stok-kodu="${escapeHTML(product.stokKodu)}"
                                data-image-index="0"
                                onerror="tryNextImage(this);"
                            >

                        </div>
                        `
                        :
                        ""
                    }


                    <div class="product-name">
                        ${escapeHTML(product.urun)}
                    </div>


                    <div>
                        <strong>Ürün Kodu:</strong>
                        ${escapeHTML(product.stokKodu)}
                    </div>


                    <div>
                        <strong>Barkod:</strong>
                        ${escapeHTML(product.barkod)}
                    </div>


                    <div>
                        <strong>Kategori:</strong>
                        ${escapeHTML(product.kategori)}
                    </div>


                    <div>
                        <strong>Cinsiyet:</strong>
                        ${escapeHTML(product.cinsiyet)}
                    </div>


                    <div>
                        <strong>Sezon:</strong>
                        ${escapeHTML(product.sezon)}
                    </div>


                    <div class="size-title">
                        BEDEN / STOK
                    </div>


                    <div class="sizes">
                        ${sizeHTML}
                    </div>

                </div>
            `;
        }
    );


    container.innerHTML =
        html;
}


/* ======================================================
   GÖRSEL BUL
====================================================== */

function findImage(product) {

    if (
        product.gorsel &&
        (
            product.gorsel.startsWith(
                "http://"
            ) ||
            product.gorsel.startsWith(
                "https://"
            )
        )
    ) {

        return product.gorsel;
    }


    if (
        product.stokKodu &&
        product.stokKodu !== "-"
    ) {

        return (
            "./images/" +
            product.stokKodu +
            ".png"
        );
    }


    return "";
}


/* ======================================================
   ALTERNATİF GÖRSELLER
====================================================== */

function tryNextImage(img) {

    const stokKodu =
        img.getAttribute(
            "data-stok-kodu"
        );

    if (!stokKodu) {

        if (img.parentElement) {
            img.parentElement.style.display =
                "none";
        }

        return;
    }


    let index =
        parseInt(
            img.getAttribute(
                "data-image-index"
            ) || "0",
            10
        );


    const candidates = [

        "./images/" +
        stokKodu +
        ".png",

        "./images/" +
        stokKodu +
        ".jpg",

        "./images/" +
        stokKodu +
        ".jpeg",

        "./images/" +
        stokKodu +
        "_0.png",

        "./images/" +
        stokKodu +
        "_0.jpg",

        "./images/" +
        stokKodu +
        "_0.jpeg"

    ];


    index++;


    if (
        index >=
        candidates.length
    ) {

        if (img.parentElement) {
            img.parentElement.style.display =
                "none";
        }

        return;
    }


    img.setAttribute(
        "data-image-index",
        index
    );


    img.src =
        candidates[index];
}


/* ======================================================
   HTML GÜVENLİĞİ
====================================================== */

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


/* ======================================================
   SAYFA AÇILIŞI
====================================================== */

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
                            function () {

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
