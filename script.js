let products = [];

async function loadProducts() {
    try {
        const response = await fetch("data.json");

        if (!response.ok) {
            throw new Error("data.json okunamadı");
        }

        products = await response.json();

        console.log("Toplam ürün:", products.length);

    } catch (error) {
        console.error(error);

        const results = document.getElementById("results");

        if (results) {
            results.innerHTML =
                "<div class='notfound'>❌ Stok verisi okunamadı.</div>";
        }
    }
}


function searchProducts(text) {

    const results = document.getElementById("results");

    if (!results) return;

    text = String(text || "")
        .trim()
        .toLocaleLowerCase("tr-TR");

    if (text === "") {
        results.innerHTML = "";
        return;
    }


    const filtered = products.filter(item => {

        const barkod = String(item.barkod || "")
            .toLocaleLowerCase("tr-TR");

        const stokKodu = String(item.stokKodu || "")
            .toLocaleLowerCase("tr-TR");

        const urun = String(item.urun || "")
            .toLocaleLowerCase("tr-TR");

        const beden = String(item.beden || "")
            .toLocaleLowerCase("tr-TR");

        const renk = String(item.renk || "")
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

        const key = String(
            item.stokKodu ||
            item.urun ||
            item.barkod ||
            "ürün"
        );


        if (!grouped[key]) {

            grouped[key] = {
                urun: item.urun || "-",
                stokKodu: item.stokKodu || "-",
                kategori: item.kategori || "-",
                cinsiyet: item.cinsiyet || "-",
                sezon: item.sezon || "-",
                renk: item.renk || "-",
                sizes: []
            };
        }


        grouped[key].sizes.push({
            beden: item.beden || "-",
            stok: Number(item.stok) || 0
        });

    });


    let html = "";


    Object.values(grouped).forEach(product => {

        product.sizes.sort((a, b) => {

            const aNum = parseFloat(a.beden);
            const bNum = parseFloat(b.beden);

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }

            return String(a.beden).localeCompare(
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


            sizeHTML += `
                <div class="size-box ${stockClass}">
                    <span class="size">${size.beden}</span>
                    <span class="quantity">${size.stok}</span>
                </div>
            `;
        });


        html += `
            <div class="product-card">

                <div class="product-name">
                    ${product.urun}
                </div>

                <div>
                    <strong>Stok Kodu:</strong>
                    ${product.stokKodu}
                </div>

                <div>
                    <strong>Renk:</strong>
                    ${product.renk}
                </div>

                <div>
                    <strong>Kategori:</strong>
                    ${product.kategori}
                </div>

                <div>
                    <strong>Cinsiyet:</strong>
                    ${product.cinsiyet}
                </div>

                <div>
                    <strong>Sezon:</strong>
                    ${product.sezon}
                </div>

                <div class="size-title">
                    BEDEN / STOK
                </div>

                <div class="sizes">
                    ${sizeHTML}
                </div>

            </div>
        `;
    });


    results.innerHTML = html;
}


document.addEventListener("DOMContentLoaded", () => {

    loadProducts();


    const input =
        document.querySelector("#searchInput") ||
        document.querySelector("#search") ||
        document.querySelector("input");


    if (!input) {
        console.error("Arama kutusu bulunamadı.");
        return;
    }


    let timer;


    input.addEventListener("input", function () {

        clearTimeout(timer);

        const value = this.value;

        timer = setTimeout(() => {
            searchProducts(value);
        }, 100);

    });

});