#!/usr/bin/env python3
"""Разбирает фотографии сортов из inbox/ в wordpress/catalog/photos/.

    python3 tools/photos/ingest.py            # разобрать всё новое
    python3 tools/photos/ingest.py --dry-run  # только показать, что куда пойдёт

Сорт определяется по имени файла: «Флорина.jpg», «ГолденДелишес.jpg»,
«Черешня Чемпион.jpg» или слаг «apple-florina.jpg». Регистр, пробелы, дефисы
и «ё» не важны. Названия, которые есть у нескольких культур (Натали, Чемпион,
Киргизская), без культуры в имени не разбираются — скрипт об этом скажет.
Родовое имя культуры подходит и для уточнённой: «Вишня Натали» — войлочная
вишня, «Яблоня Арбат» — колоновидная яблоня. Порядок слов в культуре не важен
(«Яблоня колоновидная»), опечатка заказчика «Яблона» понимается. Имена сортов,
которые расходятся с varieties.tsv и правилом не сводятся, — в ALIASES.

Исходники в inbox/ не трогаются: их удаляют вручную. Уже разобранный файл
узнаётся по хешу и повторно не обрабатывается. Сплошная рамка вокруг снимка
срезается. Кадр ужимается до 1600 px по длинной стороне — это с запасом
покрывает карточку (4:5) и страницу сорта (4:3, 640 px) на экранах с
плотностью 2x.

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

from PIL import Image, ImageChops, ImageCms, ImageOps

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

# Опечатки в названиях культур, которые приходят из документов заказчика: неверное → верное.
CULTURE_TYPOS = {"яблона": "яблоня"}

# Сорта, которые заказчик называет иначе, чем в varieties.tsv, а правилом их не свести.
# Каждая строка сверена по кадру: «Никитский» — плоские плоды, то есть «Никитский плоский».
ALIASES = {
    "peach-ananasovyy": ["Ананасный"],
    "peach-nikitskiy-ploskiy": ["Никитский"],
}

# Сплошная рамка вокруг кадра: насколько цвет может гулять внутри заливки и какая
# доля края содержимого должна отличаться от неё, чтобы это был вписанный снимок,
# а не предмет на однотонном фоне.
FRAME_TOLERANCE = 16
FRAME_MIN_MARGIN = 0.02
FRAME_EDGE_FILL = 0.5
FRAME_SEAM = 3


def norm(text: str) -> str:
    # «ё» и «э» сводим к «е»: «Краснощёкий», «Ред Хэвен» и «Ред Хевен» — одно имя.
    text = unicodedata.normalize("NFC", text).lower().replace("ё", "е").replace("э", "е")
    return re.sub(r"[^0-9a-zа-я]", "", text)


def culture_forms(culture: dict[str, str]) -> set[str]:
    """Как культуру пишут в именах файлов: «Колоновидная яблоня», «Яблоня колоновидная», «Яблона»."""
    forms = set()
    for name in (culture["name"], culture["singular"]):
        for words in (name.split(), name.split()[::-1]):
            form = norm("".join(words))
            forms.add(form)
            forms.update(form.replace(right, typo) for typo, right in CULTURE_TYPOS.items() if right in form)
    return forms


def titles(variety: dict[str, str]) -> set[str]:
    return {norm(variety["title"]), *(norm(alias) for alias in ALIASES.get(variety["slug"], []))}


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

    exact = [v for v in varieties if key in titles(v)]
    if exact:
        return exact

    # Культура в начале или в конце имени: «Черешня Чемпион», «Натали смородина».
    # Длинные формы первыми, чтобы «колоновидная яблоня» не прочиталась как «яблоня».
    names = {slug: culture_forms(c) for slug, c in cultures.items()}
    forms = sorted(
        ((form, slug) for slug, slug_forms in names.items() for form in slug_forms),
        key=lambda pair: -len(pair[0]),
    )
    # Сначала точная культура, затем родовое имя как уточнённая: «Вишня Натали» найдёт
    # войлочную вишню, «Яблоня Арбат» — колоновидную яблоню.
    for strict in (True, False):
        for form, culture in forms:
            for rest in (key.removeprefix(form), key.removesuffix(form)):
                if rest == key or not rest:
                    continue
                hits = [
                    v for v in varieties
                    if rest in titles(v)
                    and (v["culture"] == culture if strict
                         else any(name.endswith(form) for name in names.get(v["culture"], ())))
                ]
                if hits:
                    return hits
    return []


def frame_box(image: Image.Image) -> tuple[int, int, int, int] | None:
    """Снимок, вписанный в сплошную заливку со всех четырёх сторон, — его границы, иначе None.

    Карточка сама кадрирует фото под 4:5, и зелёное паспарту на ней читается как брак.
    Срезаем только явную рамку: заливка одного цвета по всем углам, отступ с каждой стороны
    и содержимое, которое заполняет свой прямоугольник до краёв, — предмет на однотонном
    фоне так не выглядит и остаётся как есть.
    """
    w, h = image.size
    corners = [image.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    if any(abs(a - b) > FRAME_TOLERANCE for c in corners for a, b in zip(c, corners[0])):
        return None

    channels = ImageChops.difference(image, Image.new("RGB", image.size, corners[0])).split()
    diff = ImageChops.lighter(ImageChops.lighter(channels[0], channels[1]), channels[2])
    mask = diff.point(lambda v: 255 if v > FRAME_TOLERANCE else 0)
    box = mask.getbbox()
    if not box:
        return None
    left, top, right, bottom = box
    if min(left, top, w - right, h - bottom) < FRAME_MIN_MARGIN * min(w, h):
        return None

    # По стыку с заливкой JPEG оставляет ореол в пару пикселей: края содержимого
    # меряем и срезаем чуть глубже.
    left, top, right, bottom = left + FRAME_SEAM, top + FRAME_SEAM, right - FRAME_SEAM, bottom - FRAME_SEAM
    edges = [(left, top, right, top + 1), (left, bottom - 1, right, bottom),
             (left, top, left + 1, bottom), (right - 1, top, right, bottom)]
    for edge in edges:
        strip = mask.crop(edge)
        if strip.histogram()[255] / (strip.width * strip.height) < FRAME_EDGE_FILL:
            return None
    return left, top, right, bottom


def to_web_jpeg(path: pathlib.Path) -> tuple[bytes, tuple[int, int, int, int] | None]:
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
        frame = frame_box(image)
        if frame:
            image = image.crop(frame)
        image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        image.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        return out.getvalue(), frame


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
        data, frame = to_web_jpeg(path)
        note = f"  (срезана рамка, остался кадр {frame[2] - frame[0]}×{frame[3] - frame[1]})" if frame else ""
        print(f"  {verb:<14} {path.name} → {slug}{note}")
        if args.dry_run:
            continue

        PHOTOS.mkdir(parents=True, exist_ok=True)
        (PHOTOS / f"{slug}.jpg").write_bytes(data)
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
