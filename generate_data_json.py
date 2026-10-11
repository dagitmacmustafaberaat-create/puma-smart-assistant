import json
import math
import re
import unicodedata
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent
EXCEL_FILE = ROOT / "Güncel Stok.xlsx"
JSON_FILE = ROOT / "data.json"


def normalize(value):
    text = str(value or "").strip().lower()
    text = text.replace("ı", "i").replace("İ", "i")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "", text)


def clean(value):
    if value is None or pd.isna(value):
        return ""
    if isinstance(value, float) and math.isfinite(value) and value.is_integer():
        return str(int(value))
    text = str(value).strip()
    if text.lower() in {"nan", "none", "nat"}:
        return ""
    # Excel bazen barkod/kod değerlerini 12345.0 biçiminde verir.
    if re.fullmatch(r"\d+\.0", text):
        text = text[:-2]
    return text


def find_column(columns, aliases):
    by_normalized = {normalize(c): c for c in columns}
    for alias in aliases:
        found = by_normalized.get(normalize(alias))
        if found is not None:
            return found
    return None


def number(value):
    if value is None or pd.isna(value):
        return 0
    if isinstance(value, (int, float)):
        return int(value) if math.isfinite(value) else 0
    text = str(value).strip().replace(" ", "")
    if not text:
        return 0
    # Stock counts should be whole numbers; handle common Turkish formatting.
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return int(float(text))
    except (ValueError, TypeError):
        return 0


def main():
    if not EXCEL_FILE.exists():
        raise FileNotFoundError(f"Excel dosyası bulunamadı: {EXCEL_FILE.name}")

    df = pd.read_excel(EXCEL_FILE, dtype=object)
    cols = df.columns

    aliases = {
        "barcode": ["Barkod", "Barcode", "EAN", "EAN13", "BARKOD NO", "Barkod No"],
        "productCode": ["Stok Kodu", "Stock Code", "Style", "Style Number", "Ürün Kodu", "Urun Kodu", "PRODUCTCODE", "PRODUCT CODE"],
        "productName": ["Ürün Adı", "Urun Adi", "Product Name", "Product", "Ürün İsmi", "Urun Ismi", "PRODUCTNAME", "PRODUCT NAME"],
        "size": ["Beden", "Size", "Beden No", "BEDEN NO", "BEDEN"],
        "stock": ["Stok Adedi", "Fiili Stok Adedi", "Stok", "Stock", "STOK ADEDİ", "STOK_ADEDI", "STOK", "STOK MİKTARI", "Mevcut Stok"],
        "gender": ["Cinsiyet", "Gender", "Cinsiyet Adı", "Cinsiyet Adi"],
        "category": ["Kategori", "Category", "Ürün Grubu", "Urun Grubu"],
        "season": ["Sezon", "Season", "Sezon Kodu"],
        "image": ["Image", "Image URL", "Görsel", "Gorsel", "Resim", "Resim URL", "Ürün Görseli", "Urun Gorseli"],
    }

    found = {key: find_column(cols, names) for key, names in aliases.items()}
    required = ["barcode", "productCode", "productName", "size", "stock"]
    missing = [key for key in required if found[key] is None]
    if missing:
        raise ValueError(
            "Excel sütunları eşleştirilemedi: " + ", ".join(missing) +
            "\nExcel'deki sütunlar: " + ", ".join(str(c) for c in cols)
        )

    # Preserve existing image URLs by product code and product name.
    old_data = []
    if JSON_FILE.exists():
        try:
            old_data = json.loads(JSON_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            old_data = []

    image_by_code = {}
    image_by_name = {}
    for item in old_data if isinstance(old_data, list) else []:
        image = clean(item.get("image", ""))
        if not image:
            continue
        code = clean(item.get("productCode", ""))
        name = normalize(item.get("productName", ""))
        if code:
            image_by_code.setdefault(code, image)
        if name:
            image_by_name.setdefault(name, image)

    products = []
    seen = set()
    for _, row in df.iterrows():
        barcode = clean(row[found["barcode"]])
        product_code = clean(row[found["productCode"]])
        product_name = clean(row[found["productName"]])
        size = clean(row[found["size"]])
        stock = number(row[found["stock"]])

        # Exclude total/footer rows, incomplete rows, and out-of-stock sizes.
        if not barcode or not product_code or not product_name or not size or stock <= 0:
            continue

        key = (barcode, product_code, size)
        if key in seen:
            continue
        seen.add(key)

        image = clean(row[found["image"]]) if found["image"] is not None else ""
        if not image:
            image = image_by_code.get(product_code, image_by_name.get(normalize(product_name), ""))

        products.append({
            "barcode": barcode,
            "productCode": product_code,
            "productName": product_name,
            "size": size,
            "stock": stock,
            "gender": clean(row[found["gender"]]) if found["gender"] is not None else "",
            "category": clean(row[found["category"]]) if found["category"] is not None else "",
            "season": clean(row[found["season"]]) if found["season"] is not None else "",
            "image": image,
        })

    if not products:
        raise ValueError("Stok > 0 olan ürün kaydı bulunamadı; mevcut data.json korunuyor.")

    JSON_FILE.write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"data.json oluşturuldu: {len(products)} stoklu beden kaydı.")
    print(f"Barkod sayısı: {len({p['barcode'] for p in products})}")
    print(f"Stok toplamı (yalnızca kontrol amaçlı): {sum(p['stock'] for p in products)}")


if __name__ == "__main__":
    main()
