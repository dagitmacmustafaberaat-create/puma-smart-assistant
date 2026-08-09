import pandas as pd
import json
import os
import re
import urllib.request
from urllib.parse import urlparse

excel_file = "Güncel Stok.xlsx"
json_file = "data.json"
image_folder = "images"

IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"]


def clean_image_url(value):
    if value is None:
        return ""

    url = str(value).strip()

    if not url or url.lower() == "nan":
        return ""

    match = re.search(r"\]\((https?://[^)]+)\)", url)

    if match:
        url = match.group(1)

    match = re.search(r"\((https?://[^)]+)\)", url)

    if match:
        url = match.group(1)

    url = url.strip("[]")
    url = url.strip("\"' ")

    if not url.startswith(("http://", "https://")):
        return ""

    return url


def clean_stock_code(value):
    if value is None:
        return ""

    value = str(value).strip()

    if value.lower() == "nan":
        return ""

    if value.endswith(".0"):
        value = value[:-2]

    return value


def find_existing_image(stock_code):
    stock_code = clean_stock_code(stock_code)

    if not stock_code:
        return ""

    for ext in IMAGE_EXTENSIONS:
        filepath = os.path.join(
            image_folder,
            stock_code + ext
        )

        if os.path.isfile(filepath):
            return (
                image_folder
                + "/"
                + stock_code
                + ext
            )

    try:
        for filename in os.listdir(image_folder):
            name, ext = os.path.splitext(filename)

            if (
                name.strip() == stock_code
                and ext.lower() in IMAGE_EXTENSIONS
            ):
                return (
                    image_folder
                    + "/"
                    + filename
                )
    except Exception:
        pass

    return ""


def get_extension(url):
    path = urlparse(url).path.lower()

    for ext in IMAGE_EXTENSIONS:
        if path.endswith(ext):
            return ext

    return ".jpg"


def download_image(url, stock_code):
    if not url:
        return ""

    stock_code = clean_stock_code(stock_code)

    if not stock_code:
        return ""

    try:
        extension = get_extension(url)

        filename = stock_code + extension

        filepath = os.path.join(
            image_folder,
            filename
        )

        if os.path.isfile(filepath):
            return (
                image_folder
                + "/"
                + filename
            )

        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0"
            }
        )

        with urllib.request.urlopen(
            request,
            timeout=20
        ) as response:
            data = response.read()

        if len(data) < 100:
            return ""

        with open(filepath, "wb") as f:
            f.write(data)

        return (
            image_folder
            + "/"
            + filename
        )

    except Exception as e:
        print(
            "Görsel indirilemedi:",
            stock_code,
            e
        )
        return ""


print("")
print("========================================")
print("PUMA SMART ASSISTANT")
print("STOK + GÖRSEL EŞLEŞTİRME")
print("========================================")
print("")

try:
    os.makedirs(
        image_folder,
        exist_ok=True
    )

    print("Excel okunuyor...")

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
        print("EKSİK EXCEL SÜTUNLARI:")

        for column in missing_columns:
            print("-", column)

        raise Exception(
            "Excel sütunları eksik."
        )

    df = df.rename(
        columns={
            "Barkod": "barkod",
            "Ürün Kodu": "stokKodu",
            "Ürün Adı": "urun",
            "Beden No": "beden",
            "Stok Adedi": "stok",
            "Kategori": "kategori",
            "Cinsiyet": "cinsiyet",
            "Sezon": "sezon",
            "Ürün Görseli": "gorsel"
        }
    )

    df = df.fillna("")

    df["stokKodu"] = df["stokKodu"].apply(
        clean_stock_code
    )

    df["gorsel"] = df["gorsel"].apply(
        clean_image_url
    )

    print("")
    print("Görseller eşleştiriliyor...")
    print("")

    existing_count = 0
    downloaded_count = 0
    failed_count = 0
    empty_count = 0

    image_cache = {}

    for index, row in df.iterrows():

        stock_code = clean_stock_code(
            row["stokKodu"]
        )

        excel_url = clean_image_url(
            row["gorsel"]
        )

        if not stock_code:
            df.at[index, "gorsel"] = ""
            empty_count += 1
            continue

        if stock_code in image_cache:
            df.at[index, "gorsel"] = image_cache[stock_code]
            continue

        print(
            f"[{index + 1}/{len(df)}] "
            f"{stock_code} - "
            f"{row['urun']}"
        )

        local_image = find_existing_image(
            stock_code
        )

        if local_image:
            df.at[index, "gorsel"] = local_image
            image_cache[stock_code] = local_image
            existing_count += 1

            print(
                "  ✓ Mevcut:",
                local_image
            )

            continue

        if excel_url:
            downloaded_image = download_image(
                excel_url,
                stock_code
            )

            if downloaded_image:
                df.at[index, "gorsel"] = downloaded_image
                image_cache[stock_code] = downloaded_image
                downloaded_count += 1

                print(
                    "  ✓ İndirildi:",
                    downloaded_image
                )

                continue

        df.at[index, "gorsel"] = ""
        image_cache[stock_code] = ""
        failed_count += 1

    records = df.to_dict(
        orient="records"
    )

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

    image_count = sum(
        1
        for item in records
        if item.get("gorsel")
    )

    print("")
    print("========================================")
    print("TAMAMLANDI")
    print("========================================")
    print("")

    print(
        "Toplam satır:",
        len(records)
    )

    print(
        "Mevcut images klasöründen eşleşen:",
        existing_count
    )

    print(
        "Yeni indirilen:",
        downloaded_count
    )

    print(
        "Görsel bulunamayan:",
        failed_count
    )

    print(
        "Boş stok kodu:",
        empty_count
    )

    print(
        "JSON'da görsel bulunan:",
        image_count
    )

    print("")

    test_code = "31015230"

    test_image = find_existing_image(
        test_code
    )

    print(
        "31015230 görsel kontrolü:"
    )

    if test_image:
        print(
            "✓ BULUNDU:",
            test_image
        )
    else:
        print(
            "✗ BULUNAMADI"
        )

    print("")
    print("data.json hazır.")
    print("GitHub'a yüklemeye hazır.")
    print("")

except Exception as e:
    print("")
    print("========================================")
    print("HATA")
    print("========================================")
    print("")
    print(e)
    print("")

input(
    "Kapatmak için ENTER'a bas..."
)