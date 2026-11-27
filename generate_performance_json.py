import json
from datetime import date, datetime, time
from pathlib import Path
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parent
SOURCES = [
    "Uygulama Verileri.xlsx",
    "Aylık Satış Verileri.xlsx",
    "Mağaza Datası.xlsx",
    "2025-2026 Karşılaştırma Yeni.xlsx",
]
OUTPUT = ROOT / "performance-data.json"


def clean(value):
    if value is None:
        return None
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def export_workbook(path):
    workbook = load_workbook(path, data_only=True, read_only=True)
    result = {"source": path.name, "sheets": []}
    for sheet in workbook.worksheets:
        rows = []
        for row_idx, row in enumerate(sheet.iter_rows(), start=1):
            cells = []
            for cell in row:
                value = clean(cell.value)
                if value is not None and value != "":
                    cells.append({
                        "column": cell.column,
                        "address": cell.coordinate,
                        "value": value,
                        "number_format": cell.number_format
                    })
            if cells:
                rows.append({"row": row_idx, "cells": cells})
        result["sheets"].append({
            "name": sheet.title,
            "max_row": sheet.max_row,
            "max_column": sheet.max_column,
            "rows": rows
        })
    workbook.close()
    return result


def main():
    missing = [name for name in SOURCES if not (ROOT / name).exists()]
    if missing:
        raise FileNotFoundError("Eksik Excel kaynakları: " + ", ".join(missing))

    payload = {
        "generated_at": datetime.now().astimezone().isoformat(),
        "sources": [export_workbook(ROOT / name) for name in SOURCES]
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print("performance-data.json oluşturuldu.")
    for source in payload["sources"]:
        print(f"- {source['source']}: {len(source['sheets'])} sayfa")


if __name__ == "__main__":
    main()
