#!/usr/bin/env python3
"""Собирает SVG иллюстраций сортов в out/ и рендерит их в WebP.

    python3 generate.py                 # все сорта из varieties.py
    python3 generate.py apple-golden-delishes
    python3 generate.py --svg-only      # без рендера, если нет контейнера фронта

Рендерит sharp из контейнера melihov-frontend: librsvg внутри libvips понимает
градиенты и feTurbulence, собственный SVG-движок ImageMagick — нет.
"""

from __future__ import annotations

import pathlib
import subprocess
import sys

from draw import scene, take_defs
from fruits import flesh_gradient
from varieties import VARIETIES

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "out"
CONTAINER = "melihov-frontend"
RENDER_JS = r"""
const sharp = require('sharp');
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', async () => {
  const out = await sharp(Buffer.concat(chunks))
    .resize(800, 1000, { fit: 'fill' })
    .webp({ quality: 92 })
    .toBuffer();
  process.stdout.write(out);
});
"""


def build_svg(slug: str) -> str:
    take_defs()  # хвост от предыдущего сорта
    art = VARIETIES[slug]["draw"]()  # маски регистрируются во время рисования
    return scene(f"    <defs>{flesh_gradient()}{take_defs()}</defs>\n" + art)


def render(svg: str) -> bytes:
    done = subprocess.run(
        ["docker", "exec", "-i", "-w", "/app", CONTAINER, "node", "-e", RENDER_JS],
        input=svg.encode(),
        capture_output=True,
    )
    if done.returncode != 0 or not done.stdout:
        raise RuntimeError(done.stderr.decode()[:2000] or "рендер вернул пустой файл")
    return done.stdout


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    svg_only = "--svg-only" in sys.argv
    slugs = args or list(VARIETIES)

    OUT.mkdir(exist_ok=True)
    for slug in slugs:
        if slug not in VARIETIES:
            print(f"нет описания сорта: {slug}", file=sys.stderr)
            return 1
        svg = build_svg(slug)
        (OUT / f"{slug}.svg").write_text(svg, encoding="utf-8")
        if svg_only:
            print(f"{slug}.svg")
            continue
        (OUT / f"{slug}.webp").write_bytes(render(svg))
        print(f"{slug}.svg + {slug}.webp")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
