import pandas as pd
import json
import math
import os

EXCEL_DOSYASI = "Güncel Stok.xlsx"
JSON_DOSYASI = "data.json"

print("========================================")
print("PUMA SMART ASSISTANT")
print("STOK VERİSİ OLUŞTURMA")
print("========================================")
print()

if not os.path.exists(EXCEL_DOSYASI):
    print("HATA:")
    print(f"'{EXCEL_DOSYASI}' bulunamadı.")
    print()

    input("Kapatmak için ENTER'a bas...")
    raise SystemExit

print("Excel okunuyor...")
print()

try:
    df = pd.read_excel(
        EXCEL_DOSYASI,
        dtype=object
    )

except Exception as e:
    print("EXCEL OKUMA HATASI:")
    print(e)

    input("Kapatmak için ENTER'a bas...")
    raise SystemExit

# Başlıkları temizle
df.columns = [
    str(column).strip()
    for column in df.columns
]

# Excel'deki gerçek başlıklar
GEREKEN_KOLONLAR = [
    "Barkod",
    "Ürün kodu",
    "Ürün Adı",
    "Beden No",
    "Stok Adedi",
    "Cinsiyet",
    "Kategori",
    "Sezon",
    "Ürün Görseli"
]

eksik = [
    kolon
    for kolon in GEREKEN_KOLONLAR
    if kolon not in df.columns
]

if eksik:

    print("========================================")
    print("HATA - EKSİK EXCEL BAŞLIĞI")
    print("========================================")

    for kolon in eksik:
        print("-", kolon)

    print()
    print("Excel'deki mevcut başlıklar:")

    for kolon in df.columns:
        print("-", kolon)

    input("\nKapatmak için ENTER'a bas...")
    raise SystemExit


def temiz_metin(value):

    if pd.isna(value):
        return ""

    return str(value).strip()


def temiz_numara(value):

    if pd.isna(value):
        return ""

    try:

        number = float(value)

        if math.isfinite(number):

            if number.is_integer():
                return str(int(number))

    except:
        pass

    return str(value).strip()


def temiz_stok(value):

    if pd.isna(value):
        return 0

    try:

        number = float(value)

        if math.isfinite(number):
            return int(number)

    except:
        pass

    return 0


kayitlar = []

for _, row in df.iterrows():

    kayit = {

        "Barkod":
            temiz_numara(row["Barkod"]),

        "Ürün Kodu":
            temiz_numara(row["Ürün kodu"]),

        "Ürün Adı":
            temiz_metin(row["Ürün Adı"]),

        "Beden No":
            temiz_metin(row["Beden No"]),

        "Stok Adedi":
            temiz_stok(row["Stok Adedi"]),

        "Cinsiyet":
            temiz_metin(row["Cinsiyet"]),

        "Kategori":
            temiz_metin(row["Kategori"]),

        "Sezon":
            temiz_metin(row["Sezon"]),

        "Ürün Görseli":
            temiz_metin(row["Ürün Görseli"])
    }

    kayitlar.append(kayit)


with open(
    JSON_DOSYASI,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        kayitlar,
        file,
        ensure_ascii=False,
        indent=2
    )


print()
print("===================================")
print("BAŞARILI")
print("===================================")
print(f"Excel satırı : {len(df)}")
print(f"JSON kaydı   : {len(kayitlar)}")
print(f"Oluşan dosya : {JSON_DOSYASI}")
print("===================================")


# 395205 kontrolü

kontrol = [
    item
    for item in kayitlar
    if "395205" in item["Ürün Kodu"]
]

print()
print("395205 KONTROLÜ")
print("-----------------------------------")
print(f"Bulunan kayıt: {len(kontrol)}")

if kontrol:

    print()
    print("İlk kayıt:")

    print(
        json.dumps(
            kontrol[0],
            ensure_ascii=False,
            indent=2
        )
    )

else:

    print("395205 bulunamadı.")


print()
input("Kapatmak için ENTER'a bas..."
)