import json
import os
import sys

try:
    import pandas as pd
except ImportError:
    print("pandas kurulu değil.")
    print("Terminalde şu komutu çalıştır:")
    print("pip install pandas openpyxl")
    input("\nKapatmak için Enter'a bas...")
    sys.exit()


# ============================================================
# PUMA SMART ASSISTANT
# GPOS EXCEL -> JSON DONUSTURUCU
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(BASE_DIR, "data.json")


def clean_value(value):
    """Excel hücrelerindeki boş/NaN değerleri temizler."""
    if pd.isna(value):
        return ""

    if isinstance(value, float) and value.is_integer():
        return str(int(value))

    return str(value).strip()


def find_column(df, possible_names):
    """Excel sütun adını güvenli şekilde bulur."""

    normalized = {}

    for column in df.columns:
        key = str(column).strip().lower()
        normalized[key] = column

    for name in possible_names:
        key = name.strip().lower()

        if key in normalized:
            return normalized[key]

    return None


def main():

    print("=" * 55)
    print("      PUMA SMART ASSISTANT")
    print("      GPOS EXCEL -> JSON")
    print("=" * 55)

    print()

    excel_path = input(
        "GPOS Excel dosyasının yolunu yaz veya dosyayı buraya sürükle:\n> "
    ).strip()

    # Windows'ta dosya sürüklenince tırnak gelebilir
    excel_path = excel_path.strip('"').strip("'")

    if not os.path.exists(excel_path):

        print()
        print("❌ Dosya bulunamadı.")
        print("Dosya yolunu kontrol et.")

        input("\nKapatmak için Enter'a bas...")
        return

    try:

        print()
        print("Excel okunuyor...")

        df = pd.read_excel(excel_path)

    except Exception as e:

        print()
        print("❌ Excel okunamadı.")
        print(e)

        input("\nKapatmak için Enter'a bas...")
        return

    # --------------------------------------------------------
    # SÜTUNLARI BUL
    # --------------------------------------------------------

    barkod_col = find_column(
        df,
        [
            "Barkod",
            "Barcode",
            "EAN",
            "EAN13"
        ]
    )

    stok_kodu_col = find_column(
        df,
        [
            "Stok Kodu",
            "Stock Code",
            "Style",
            "Style Number"
        ]
    )

    urun_col = find_column(
        df,
        [
            "Ürün Adı",
            "Urun Adi",
            "Product Name",
            "Product"
        ]
    )

    beden_col = find_column(
        df,
        [
            "Beden",
            "Size"
        ]
    )

    stok_col = find_column(
        df,
        [
            "Stok Adedi",
            "Fiili Stok Adedi",
            "Stok",
            "Stock"
        ]
    )

    kategori_col = find_column(
        df,
        [
            "Kategori",
            "Category"
        ]
    )

    cinsiyet_col = find_column(
        df,
        [
            "Cinsiyet",
            "Gender"
        ]
    )

    sezon_col = find_column(
        df,
        [
            "Sezon",
            "Season"
        ]
    )

    columns = {
        "Barkod": barkod_col,
        "Stok Kodu": stok_kodu_col,
        "Ürün Adı": urun_col,
        "Beden": beden_col,
        "Stok Adedi": stok_col,
        "Kategori": kategori_col,
        "Cinsiyet": cinsiyet_col,
        "Sezon": sezon_col
    }

    missing = [
        name
        for name, column in columns.items()
        if column is None
    ]

    if missing:

        print()
        print("❌ Excel'de şu sütunlar bulunamadı:")

        for item in missing:
            print("   -", item)

        print()
        print("Excel'deki mevcut sütunlar:")

        for column in df.columns:
            print("   -", column)

        input("\nKapatmak için Enter'a bas...")
        return

    # --------------------------------------------------------
    # JSON OLUŞTUR
    # --------------------------------------------------------

    products = []

    for _, row in df.iterrows():

        product = {

            "barkod": clean_value(
                row[barkod_col]
            ),

            "stokKodu": clean_value(
                row[stok_kodu_col]
            ),

            "urun": clean_value(
                row[urun_col]
            ),

            "beden": clean_value(
                row[beden_col]
            ),

            "stok": clean_value(
                row[stok_col]
            ),

            "kategori": clean_value(
                row[kategori_col]
            ),

            "cinsiyet": clean_value(
                row[cinsiyet_col]
            ),

            "sezon": clean_value(
                row[sezon_col]
            )
        }

        products.append(product)

    # --------------------------------------------------------
    # JSON KAYDET
    # --------------------------------------------------------

    try:

        with open(
            OUTPUT_FILE,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                products,
                file,
                ensure_ascii=False,
                indent=2
            )

    except Exception as e:

        print()
        print("❌ data.json oluşturulamadı.")
        print(e)

        input("\nKapatmak için Enter'a bas...")
        return

    # --------------------------------------------------------
    # SONUÇ
    # --------------------------------------------------------

    print()
    print("=" * 55)
    print("✅ İŞLEM TAMAMLANDI")
    print("=" * 55)

    print()
    print("Ürün satırı :", len(products))
    print("Oluşturulan :", OUTPUT_FILE)

    print()
    print("Artık data.json dosyan güncellendi.")

    input("\nKapatmak için Enter'a bas...")


if __name__ == "__main__":
    main()