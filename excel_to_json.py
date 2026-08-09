import pandas as pd
import json
import os
import re
import urllib.request
import urllib.error
from urllib.parse import urlparse


# ============================================================
# AYARLAR
# ============================================================

excel_file = "Güncel Stok.xlsx"
json_file = "data.json"
image_folder = "images"


# ============================================================
# GÖRSEL URL'SİNİ TEMİZLE
# ============================================================

def clean_image_url(value):

    if value is None:
        return ""

    url = str(value).strip()

    if not url or url.lower() == "nan":
        return ""

    # Markdown formatı:
    # [https://site.com/resim.png](https://site.com/resim.png)
    match = re.search(r"\]\((https?://[^)]+)\)", url)

    if match:
        url = match.group(1)

    # Direkt parantezli format
    match = re.search(r"\((https?://[^)]+)\)", url)

    if match:
        url = match.group(1)

    # Köşeli parantezleri temizle
    url = url.strip("[]")

    # Tırnakları temizle
    url = url.strip("\"' ")

    if not (
        url.startswith("http://")
        or url.startswith("https://")
    ):
        return ""

    return url


# ============================================================
# DOSYA UZANTISINI BUL
# ============================================================

def get_extension(url, content_type=""):

    # Önce URL'den uzantı bul
    path = urlparse(url).path.lower()

    extensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif"
    ]

    for ext in extensions:

        if path.endswith(ext):
            return ext

    # Content-Type kontrolü
    content_type = content_type.lower()

    if "png" in content_type:
        return ".png"

    if "jpeg" in content_type:
        return ".jpg"

    if "jpg" in content_type:
        return ".jpg"

    if "webp" in content_type:
        return ".webp"

    if "gif" in content_type:
        return ".gif"

    return ".jpg"


# ============================================================
# GÖRSELİ İNDİR
# ============================================================

def download_image(url, filename):

    try:

        filepath = os.path.join(
            image_folder,
            filename
        )

        # Daha önce indirilmişse tekrar indirme
        if os.path.exists(filepath):
            return "images/" + filename


        request = urllib.request.Request(
            url,
            headers={
                "User-Agent":
                    "Mozilla/5.0"
            }
        )


        with urllib.request.urlopen(
            request,
            timeout=20
        ) as response:

            content_type = response.headers.get(
                "Content-Type",
                ""
            )


            data = response.read()


        # Çok küçük / boş dosyaları kabul etme
        if len(data) < 100:

            print(
                "  ! Görsel boş veya geçersiz:",
                url
            )

            return ""


        with open(
            filepath,
            "wb"
        ) as f:

            f.write(data)


        return "images/" + filename


    except Exception as e:

        print(
            "  ! Görsel indirilemedi:",
            url
        )

        print(
            "    Hata:",
            e
        )

        return ""


# ============================================================
# BAŞLANGIÇ
# ============================================================

try:

    print("")
    print("========================================")
    print("PUMA SMART ASSISTANT")
    print("STOK + GÖRSEL GÜNCELLEME")
    print("========================================")
    print("")


    # ========================================================
    # IMAGES KLASÖRÜ
    # ========================================================

    os.makedirs(
        image_folder,
        exist_ok=True
    )


    # ========================================================
    # EXCEL OKU
    # ========================================================

    print(
        "Excel okunuyor..."
    )


    df = pd.read_excel(
        excel_file
    )


    print(
        "Excel başarıyla okundu."
    )


    print(
        "Toplam satır:",
        len(df)
    )


    # ========================================================
    # SÜTUNLARI KONTROL ET
    # ========================================================

    print("")
    print(
        "Excel sütunları kontrol ediliyor..."
    )


    required_columns = [
        "Barkod",
        "Ürün Kodu",
        "Ürün Adı",
        "Beden No",
        "Stok Adedi",
        "Kategori",
        "Cinsiyet",
        "Sezon",
        "Ürün Görseli"
    ]


    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]


    if missing_columns:

        print("")
        print(
            "HATA: Excel'de şu sütunlar bulunamadı:"
        )

        for column in missing_columns:
            print(
                " -",
                column
            )

        raise Exception(
            "Excel sütunları eksik."
        )


    print(
        "Tüm gerekli sütunlar bulundu."
    )


    # ========================================================
    # JSON ALANLARINA ÇEVİR
    # ========================================================

    df = df.rename(
        columns={

            "Barkod":
                "barkod",

            "Ürün Kodu":
                "stokKodu",

            "Ürün Adı":
                "urun",

            "Beden No":
                "beden",

            "Stok Adedi":
                "stok",

            "Kategori":
                "kategori",

            "Cinsiyet":
                "cinsiyet",

            "Sezon":
                "sezon",

            "Ürün Görseli":
                "gorsel"
        }
    )


    # ========================================================
    # BOŞ HÜCRELER
    # ========================================================

    df = df.fillna("")


    # ========================================================
    # GÖRSEL URL'LERİNİ TEMİZLE
    # ========================================================

    df["gorsel"] = (
        df["gorsel"]
        .astype(str)
        .apply(clean_image_url)
    )


    # ========================================================
    # GÖRSELLERİ İNDİR
    # ========================================================

    print("")
    print("========================================")
    print("GÖRSELLER İNDİRİLİYOR")
    print("========================================")
    print("")


    downloaded = 0
    failed = 0
    no_image = 0


    # Aynı görsel URL'sini tekrar indirmemek için
    downloaded_urls = {}


    for index, row in df.iterrows():

        url = row["gorsel"]


        if not url:

            no_image += 1
            continue


        # Daha önce aynı URL işlendi mi?
        if url in downloaded_urls:

            df.at[
                index,
                "gorsel"
            ] = downloaded_urls[url]

            continue


        # ====================================================
        # DOSYA ADI
        # ====================================================

        stock_code = str(
            row["stokKodu"]
        ).strip()


        if (
            not stock_code
            or stock_code.lower() == "nan"
        ):

            stock_code = "urun_" + str(
                index
            )


        # Güvenli dosya adı
        safe_stock_code = re.sub(
            r"[^a-zA-Z0-9_-]",
            "_",
            stock_code
        )


        extension = get_extension(url)


        filename = (
            safe_stock_code +
            extension
        )


        print(
            f"[{index + 1}/{len(df)}] "
            f"{row['urun']}"
        )


        local_path = download_image(
            url,
            filename
        )


        if local_path:

            df.at[
                index,
                "gorsel"
            ] = local_path


            downloaded_urls[url] = (
                local_path
            )


            downloaded += 1


        else:

            # İndirilemezse boş bırak
            df.at[
                index,
                "gorsel"
            ] = ""


            failed += 1


    # ========================================================
    # JSON OLUŞTUR
    # ========================================================

    print("")
    print(
        "JSON oluşturuluyor..."
    )


    records = df.to_dict(
        orient="records"
    )


    # ========================================================
    # DATA.JSON YAZ
    # ========================================================

    with open(
        json_file,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            records,
            f,
            ensure_ascii=False,
            indent=2
        )


    # ========================================================
    # SONUÇ
    # ========================================================

    image_count = sum(
        1
        for item in records
        if item.get("gorsel")
    )


    print("")
    print("========================================")
    print("STOK GÜNCELLEME TAMAMLANDI")
    print("========================================")
    print("")


    print(
        "Toplam ürün satırı:",
        len(records)
    )


    print(
        "İndirilen görsel:",
        downloaded
    )


    print(
        "Daha önce indirilen/tekrar kullanılan:",
        len(downloaded_urls) - downloaded
        if len(downloaded_urls) > downloaded
        else 0
    )


    print(
        "Görsel bulunmayan satır:",
        no_image
    )


    print(
        "İndirilemeyen görsel:",
        failed
    )


    print(
        "JSON'da görsel bulunan satır:",
        image_count
    )


    print("")
    print(
        "data.json başarıyla oluşturuldu."
    )


    print(
        "images klasörü oluşturuldu."
    )


    print("")
    print(
        "Şimdi GitHub/Vercel'e yüklemeye hazır."
    )


    print("")


except Exception as e:

    print("")
    print("========================================")
    print("HATA OLUŞTU")
    print("========================================")
    print("")

    print(e)

    print("")


input(
    "Kapatmak için ENTER'a bas..."
)