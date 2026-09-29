#!/usr/bin/env python3
"""Разбирает фотографии сортов из inbox/ в wordpress/catalog/photos/.

    python3 tools/photos/ingest.py            # разобрать всё новое
    python3 tools/photos/ingest.py --dry-run  # только показать, что куда пойдёт

Сорт определяется по имени файла: «Флорина.jpg», «ГолденДелишес.jpg»,
«Черешня Чемпион.jpg» или слаг «apple-florina.jpg». Регистр, пробелы, дефисы
и «ё» не важны. Названия, которые есть у нескольких культур (Натали, Чемпион,
Киргизская), без культуры в имени не разбираются — скрипт об этом скажет.

Исходники в inbox/ не трогаются: их удаляют вручную. Уже разобранный файл
узнаётся по хешу и повторно не обрабатывается. Кадр ужимается до 1600 px
по длинной стороне — это с запасом покрывает карточку (4:5) и страницу
сорта (4:3, 640 px) на экранах с плотностью 2x.

Дальше — импорт в WordPress, см. wordpress/catalog/README.md, раздел «Фотографии».
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import pathlib
import re
import sys
import unicodedata

from PIL import Image, ImageCms, ImageOps

ROOT = pathlib.Path(__file__).resolve().parents[2]
INBOX = ROOT / "inbox"
CATALOG = ROOT / "wordpress" / "catalog"
VARIETIES = CATALOG / "varieties.tsv"
MANIFEST = CATALOG / "photos.tsv"
PHOTOS = CATALOG / "photos"
CULTURES_TS = ROOT / "frontend" / "lib" / "catalog.ts"

MAX_SIDE = 1600
QUALITY = 86
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
FIELDS = ["slug", "alt", "source", "sha256"]


def norm(text: str) -> str:
    text = unicodedata.normalize("NFC", text).lower().replace("ё", "е")
    return re.sub(r"[^0-9a-zа-я]", "", text)


def load_cultures() -> dict[str, dict[str, str]]:
    """Культуры с формами имени — из frontend/lib/catalog.ts, чтобы не держать второй список."""
    source = CULTURES_TS.read_text(encoding="utf-8")
    found = re.findall(r'name: "([^"]+)", singular: "([^"]+)", slug: "([^"]+)"', source)
    if not found:
        sys.exit(f"не разобрал культуры в {CULTURES_TS.relative_to(ROOT)}")
    return {slug: {"name": name, "singular": singular} for name, singular, slug in found}


def load_varieties() -> list[dict[str, str]]:
    with VARIETIES.open(encoding="utf-8", newline="") as fh:
        return [row for row in csv.DictReader(fh, delimiter="\t") if row.get("slug")]


def load_manifest() -> list[dict[str, str]]:
    if not MANIFEST.exists():
        return []
    with MANIFEST.open(encoding="utf-8", newline="") as fh:
        return list(csv.DictReader(fh, delimiter="\t"))


def save_manifest(rows: list[dict[str, str]]) -> None:
    order = {row["slug"]: i for i, row in enumerate(load_varieties())}
    rows = sorted(rows, key=lambda row: order.get(row["slug"], len(order)))
    with MANIFEST.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS, delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def match(stem: str, varieties: list[dict[str, str]], cultures: dict[str, dict[str, str]]) -> list[dict[str, str]]:
    """Все сорта, под которые подходит имя файла. Больше одного — имя неоднозначно."""
    key = norm(stem)
    by_slug = [v for v in varieties if norm(v["slug"]) == key]
    if by_slug:
        return by_slug

    exact = [v for v in varieties if norm(v["title"]) == key]
    if exact:
        return exact

    # Культура в начале или в конце имени: «Черешня Чемпион», «Натали смородина».
    # Длинные формы первыми, чтобы «колоновидная яблоня» не прочиталась как «яблоня».
    forms = sorted(
        ((norm(form), slug) for slug, c in cultures.items() for form in (c["name"], c["singular"])),
        key=lambda pair: -len(pair[0]),
    )
    for form, culture in forms:
        for rest in (key.removeprefix(form), key.removesuffix(form)):
            if rest == key or not rest:
                continue
            hits = [v for v in varieties if v["culture"] == culture and norm(v["title"]) == rest]
            if hits:
                return hits
    return []


def to_web_jpeg(path: pathlib.Path) -> bytes:
    with Image.open(path) as src:
        image = ImageOps.exif_transpose(src)
        icc = src.info.get("icc_profile")
        if icc:
            # Витрина и браузеры считают кадр sRGB — переводим, а не выбрасываем профиль молча.
            srgb = ImageCms.createProfile("sRGB")
            image = ImageCms.profileToProfile(
                image.convert("RGB"), ImageCms.ImageCmsProfile(io.BytesIO(icc)), srgb, outputMode="RGB"
            )
        image = image.convert("RGB")
        image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        image.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        return out.getvalue()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="ничего не записывать")
    args = parser.parse_args()

    cultures = load_cultures()
    varieties = load_varieties()
    manifest = {row["slug"]: row for row in load_manifest()}
    known = {row["sha256"]: row["slug"] for row in manifest.values()}

    files = sorted(
        (p for p in INBOX.iterdir() if p.is_file() and p.suffix.lower() in EXTENSIONS),
        key=lambda p: p.stat().st_mtime,
    ) if INBOX.is_dir() else []

    # Два файла на один сорт в одной пачке: берём более свежий, о втором говорим.
    plan: dict[str, tuple[pathlib.Path, str, dict[str, str]]] = {}
    problems = 0

    for path in files:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in known:
            print(f"  уже в каталоге  {path.name} → {known[digest]}")
            continue

        hits = match(path.stem, varieties, cultures)
        if not hits:
            print(f"! нет сорта      {path.name}: имя не совпало ни с одним сортом из varieties.tsv")
            problems += 1
            continue
        if len(hits) > 1:
            options = ", ".join(f"{cultures[v['culture']]['singular']} {v['title']}" for v in hits)
            print(f"! неоднозначно   {path.name}: {options} — добавьте культуру в имя файла")
            problems += 1
            continue

        variety = hits[0]
        if variety["slug"] in plan:
            print(f"! дубль          {plan[variety['slug']][0].name} пропущен, взят более новый {path.name}")
        plan[variety["slug"]] = (path, digest, variety)

    for slug, (path, digest, variety) in plan.items():
        previous = manifest.get(slug)
        verb = "замена" if previous else "новое"
        print(f"  {verb:<14} {path.name} → {slug}")
        if args.dry_run:
            continue

        PHOTOS.mkdir(parents=True, exist_ok=True)
        (PHOTOS / f"{slug}.jpg").write_bytes(to_web_jpeg(path))
        singular = cultures.get(variety["culture"], {}).get("singular", "")
        manifest[slug] = {
            # alt описывает то, что на кадре, и уточняется в photos.tsv руками. У нового кадра
            # старое описание могло устареть, поэтому начинаем с нейтрального «культура + сорт».
            "alt": f"{singular} {variety['title']}".strip(),
            "slug": slug,
            "source": path.name,
            "sha256": digest,
        }

    if plan and not args.dry_run:
        save_manifest(list(manifest.values()))

    print(f"\nновых: {len(plan)}, проблем: {problems}" + (" (пробный прогон)" if args.dry_run else ""))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
