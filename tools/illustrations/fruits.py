"""Силуэты плодов. Один рисовальщик на культуру, различия сорта — в параметрах.

Профиль плода задаётся правой половиной сверху вниз: x — доля полуширины (0…1),
y — доля полувысоты (−1…1). Обе оси нормированы одинаково, поэтому rx и ry
всегда означают полуширину и полувысоту.
"""

from __future__ import annotations

import math
import random

from draw import (
    BRONZE,
    CX,
    CY,
    W_CONTOUR,
    W_DETAIL,
    W_HAIR,
    W_STEM,
    Leaf,
    behind,
    catmull_rom,
    dot,
    fill_dot,
    leaf_group,
    mirror,
    occlude,
    scale,
    stroke,
)

Point = tuple[float, float]


def flesh_gradient() -> str:
    return (
        '<linearGradient id="flesh" x1="0.15" y1="0" x2="0.6" y2="1">'
        f'<stop offset="0%" stop-color="{BRONZE}" stop-opacity="0.13"/>'
        f'<stop offset="100%" stop-color="{BRONZE}" stop-opacity="0.03"/>'
        "</linearGradient>"
    )


def outline(profile: list[Point], rx: float, ry: float, cx: float, cy: float) -> str:
    return catmull_rom(scale(mirror(profile), rx, ry, cx, cy), closed=True)


def body(d: str, opacity: float = 1.0) -> str:
    """Контур плода: полупрозрачное «стекло» внутри + бронзовая обводка."""
    return f'<path d="{d}" fill="url(#flesh)" opacity="{opacity}"/>\n' + stroke(
        d, W_CONTOUR, opacity
    )


def _rng(seed: int):
    return random.Random(seed).random


def speckle(
    cx: float, cy: float, rx: float, ry: float, count: int, seed: int, r=(2.0, 3.4)
) -> list[str]:
    """Лентицели — точки по поверхности плода, к краю реже и мельче."""
    rnd = _rng(seed)
    out = []
    for _ in range(count):
        a = rnd() * math.tau
        rad = math.sqrt(rnd()) * 0.78
        size = (r[0] + rnd() * (r[1] - r[0])) * (1 - rad * 0.35)
        out.append(
            fill_dot(
                cx + math.cos(a) * rad * rx,
                cy + math.sin(a) * rad * ry,
                size,
                0.34 + 0.20 * (1 - rad),
            )
        )
    return out


def stem(x0: float, y0: float, length: float, lean: float, width=W_STEM) -> str:
    """Плодоножка: дуга вверх с наклоном, к концу тоньше."""
    pts = [
        (x0, y0),
        (x0 + lean * 0.20, y0 - length * 0.38),
        (x0 + lean * 0.68, y0 - length * 0.74),
        (x0 + lean, y0 - length),
    ]
    return stroke(catmull_rom(pts, closed=False), width, 0.92)


def calyx(cx: float, cy: float, size: float, rays: int = 5) -> list[str]:
    """Чашечка в донце — короткие лучи из центра блюдца."""
    out = []
    for k in range(rays):
        a = math.pi / 2 + k * math.tau / rays
        out.append(
            stroke(
                f"M {cx:.1f} {cy:.1f} L {cx + math.cos(a) * size:.1f} "
                f"{cy + math.sin(a) * size * 0.62:.1f}",
                W_HAIR,
                0.48,
            )
        )
    return out


# --- яблоня -----------------------------------------------------------------

APPLE_CONICAL = [  # Голден Делишес: вытянутое, к чашечке заметно сужается
    (0.00, -0.84),
    (0.26, -0.96),
    (0.55, -0.90),
    (0.82, -0.60),
    (0.96, -0.18),
    (1.00, 0.16),
    (0.92, 0.50),
    (0.71, 0.78),
    (0.42, 0.94),
    (0.20, 0.99),
    (0.00, 0.965),
]

APPLE_ROUND = [  # приплюснутое, широкое — Айдаред, Чемпион
    (0.00, -0.80),
    (0.32, -0.93),
    (0.64, -0.84),
    (0.90, -0.50),
    (1.00, -0.04),
    (0.98, 0.34),
    (0.82, 0.68),
    (0.52, 0.90),
    (0.24, 0.97),
    (0.00, 0.94),
]


def apple(
    profile: list[Point],
    rx: float,
    ry: float,
    *,
    seed: int = 1,
    lenticels: int = 24,
    ribs: int = 3,
    stem_lean: float = 14,
    stem_len: float = 96,
    leaf: Leaf | None = None,
    leaf_at: tuple[float, float, float] = (34, -180, -28),
) -> str:
    d = outline(profile, rx, ry, CX, CY)
    top = CY + profile[0][1] * ry
    bottom = CY + profile[-1][1] * ry
    parts = [body(d)]

    # Рёбра у чашечки: парные дуги от блюдца вверх, повторяют скат плода.
    for i in range(ribs):
        t = -1 + 2 * i / max(ribs - 1, 1)
        if abs(t) < 0.2:
            continue
        x = CX + t * rx * 0.30
        y0 = bottom - ry * 0.10
        parts.append(
            stroke(
                f"M {x:.1f} {y0:.1f} C {x + t * 30:.1f} {y0 - ry * 0.14:.1f} "
                f"{x + t * 46:.1f} {y0 - ry * 0.26:.1f} {x + t * 54:.1f} {y0 - ry * 0.42:.1f}",
                W_DETAIL,
                0.22,
            )
        )

    parts += calyx(CX, bottom - ry * 0.03, 15)
    parts += speckle(CX, CY + ry * 0.06, rx * 0.86, ry * 0.84, lenticels, seed)
    parts.append(stem(CX + 2, top + ry * 0.04, stem_len, stem_lean))
    if leaf:
        lx, ly, la = leaf_at
        parts.append(leaf_group(leaf, CX + lx, CY + ly, la))
    return "\n".join(parts)


# --- груша ------------------------------------------------------------------

PEAR_LONG_NECK = [  # Аббат Фетель: длинная шейка, широкая часть внизу
    (0.00, -1.00),
    (0.13, -0.96),
    (0.18, -0.87),
    (0.20, -0.73),
    (0.24, -0.56),
    (0.32, -0.36),
    (0.47, -0.14),
    (0.66, 0.06),
    (0.85, 0.31),
    (0.97, 0.56),
    (1.00, 0.75),
    (0.90, 0.91),
    (0.62, 1.00),
    (0.30, 1.02),
    (0.00, 1.00),
]


def pear(
    profile: list[Point],
    rx: float,
    ry: float,
    *,
    seed: int = 2,
    lenticels: int = 30,
    stem_lean: float = 20,
    stem_len: float = 92,
    leaf: Leaf | None = None,
    leaf_at: tuple[float, float, float] = (-30, -232, -152),
) -> str:
    d = outline(profile, rx, ry, CX, CY)
    top = CY + profile[0][1] * ry
    bottom = CY + profile[-1][1] * ry
    parts = [body(d)]

    # Оржавленность у плодоножки — короткие штрихи по шейке.
    rnd = _rng(seed + 3)
    for i in range(7):
        a = math.pi * (0.15 + 0.70 * i / 6)
        x = CX + math.cos(a) * rx * 0.17
        y = top + ry * (0.06 + rnd() * 0.07)
        parts.append(
            stroke(f"M {x:.1f} {y:.1f} l {math.cos(a) * 7:.1f} {6:.1f}", W_HAIR, 0.22)
        )

    parts += calyx(CX, bottom - ry * 0.04, 16)
    parts += speckle(CX, CY + ry * 0.42, rx * 0.78, ry * 0.44, lenticels, seed, (1.8, 3.0))
    parts.append(stem(CX, top + ry * 0.01, stem_len, stem_lean))
    if leaf:
        lx, ly, la = leaf_at
        parts.append(leaf_group(leaf, CX + lx, CY + ly, la))
    return "\n".join(parts)


# --- черешня и вишня --------------------------------------------------------

CHERRY_HEART = [  # округло-сердцевидная, с ямкой у плодоножки: Ревна
    (0.00, -0.78),
    (0.33, -0.93),
    (0.68, -0.80),
    (0.93, -0.44),
    (1.00, 0.00),
    (0.94, 0.44),
    (0.72, 0.78),
    (0.38, 0.97),
    (0.00, 1.00),
]


def cherry_pair(
    profile: list[Point],
    r1: float,
    r2: float,
    *,
    seed: int = 3,
    junction: tuple[float, float] = (0, -250),
    left: tuple[float, float] = (-96, 74),
    right: tuple[float, float] = (92, 30),
    leaf: Leaf | None = None,
    leaf_at: tuple[float, float, float] = (28, -246, -34),
    leaf2_at: tuple[float, float, float] | None = (-16, -238, -146),
) -> str:
    jx, jy = CX + junction[0], CY + junction[1]
    parts = []

    for (dx, dy), rr, bend in ((left, r1, -1.5), (right, r2, 1.0)):
        fx, fy = CX + dx, CY + dy
        top = fy - 0.78 * rr * 1.05
        # Плодоножка от узла к плоду: длинная, слегка провисает наружу.
        pts = [
            (jx, jy),
            (jx + (fx - jx) * 0.26 + bend * 34, jy + (top - jy) * 0.28),
            (jx + (fx - jx) * 0.70 + bend * 26, jy + (top - jy) * 0.72),
            (fx + 2, top),
        ]
        parts.append(stroke(catmull_rom(pts, closed=False), W_STEM, 0.92))

    for (dx, dy), rr, s in ((left, r1, seed), (right, r2, seed + 5)):
        fx, fy = CX + dx, CY + dy
        parts.append(body(outline(profile, rr, rr * 1.05, fx, fy)))
        # Боковой шов.
        parts.append(
            stroke(
                f"M {fx - rr * 0.10:.1f} {fy - rr * 0.72:.1f} "
                f"C {fx - rr * 0.40:.1f} {fy - rr * 0.26:.1f} "
                f"{fx - rr * 0.38:.1f} {fy + rr * 0.30:.1f} "
                f"{fx - rr * 0.14:.1f} {fy + rr * 0.92:.1f}",
                W_DETAIL,
                0.5,
            )
        )
        # Ямка у плодоножки.
        parts.append(
            stroke(
                f"M {fx - rr * 0.30:.1f} {fy - rr * 0.80:.1f} "
                f"Q {fx:.1f} {fy - rr * 0.62:.1f} {fx + rr * 0.30:.1f} {fy - rr * 0.80:.1f}",
                W_HAIR,
                0.5,
            )
        )
        # Блик.
        parts.append(
            stroke(
                f"M {fx + rr * 0.30:.1f} {fy - rr * 0.44:.1f} "
                f"Q {fx + rr * 0.62:.1f} {fy - rr * 0.16:.1f} "
                f"{fx + rr * 0.58:.1f} {fy + rr * 0.24:.1f}",
                W_HAIR,
                0.34,
            )
        )
        parts += speckle(fx, fy, rr * 0.6, rr * 0.6, 6, s, (1.5, 2.3))

    parts.append(dot(jx, jy, 6, 0.8))
    if leaf:
        lx, ly, la = leaf_at
        parts.append(leaf_group(leaf, CX + lx, CY + ly, la))
        if leaf2_at:
            lx, ly, la = leaf2_at
            small = Leaf(
                leaf.length * 0.74,
                leaf.width * 0.80,
                leaf.bend * 1.2,
                leaf.teeth,
                leaf.tooth,
                leaf.tip,
                leaf.base,
            )
            parts.append(leaf_group(small, CX + lx, CY + ly, la, veins=4))
    return "\n".join(parts)


# --- слива ------------------------------------------------------------------

PLUM_OVAL = [  # Стенлей: удлинённо-яйцевидная, широкая часть ниже середины
    (0.00, -0.93),
    (0.22, -0.965),
    (0.50, -0.86),
    (0.78, -0.52),
    (0.95, -0.06),
    (1.00, 0.32),
    (0.90, 0.66),
    (0.66, 0.90),
    (0.36, 1.00),
    (0.00, 1.005),
]


def plum(
    profile: list[Point],
    rx: float,
    ry: float,
    *,
    seed: int = 4,
    second: tuple[float, float, float] | None = (-152, 84, 0.62),
    stem_lean: float = 16,
    stem_len: float = 88,
    leaf: Leaf | None = None,
    leaf_at: tuple[float, float, float] = (66, -196, -36),
) -> str:
    d = outline(profile, rx, ry, CX, CY)
    top = CY + profile[0][1] * ry
    parts = []

    # Второй плод вполоборота — уходит за первый, поэтому пересечение вырезаем.
    if second:
        sx, sy, k = second
        fx, fy = CX + sx, CY + sy
        back_d = outline(profile, rx * k, ry * k, fx, fy)
        back = body(back_d, 0.66) + stroke(
            f"M {fx + rx * k * 0.34:.1f} {fy - ry * k * 0.86:.1f} "
            f"C {fx + rx * k * 0.06:.1f} {fy - ry * k * 0.24:.1f} "
            f"{fx + rx * k * 0.06:.1f} {fy + ry * k * 0.30:.1f} "
            f"{fx + rx * k * 0.28:.1f} {fy + ry * k * 0.92:.1f}",
            W_DETAIL,
            0.34,
        )
        parts.append(behind(back, d))

    parts.append(body(d))

    # Брюшной шов — главная примета сливы.
    parts.append(
        stroke(
            f"M {CX + rx * 0.12:.1f} {CY - ry * 0.90:.1f} "
            f"C {CX - rx * 0.28:.1f} {CY - ry * 0.30:.1f} "
            f"{CX - rx * 0.28:.1f} {CY + ry * 0.28:.1f} "
            f"{CX + rx * 0.04:.1f} {CY + ry * 0.98:.1f}",
            W_DETAIL + 0.4,
            0.62,
        )
    )
    # Восковой налёт — три мягкие дуги вдоль освещённого бока.
    for i in range(3):
        k = 0.50 + i * 0.13
        parts.append(
            stroke(
                f"M {CX + rx * k:.1f} {CY - ry * 0.42:.1f} "
                f"Q {CX + rx * (k + 0.22):.1f} {CY:.1f} "
                f"{CX + rx * (k - 0.04):.1f} {CY + ry * 0.44:.1f}",
                W_HAIR,
                0.18,
            )
        )

    parts += speckle(CX, CY, rx * 0.74, ry * 0.74, 9, seed, (1.6, 2.4))
    parts.append(stem(CX + 4, top + ry * 0.02, stem_len, stem_lean))
    if leaf:
        lx, ly, la = leaf_at
        parts.append(leaf_group(leaf, CX + lx, CY + ly, la))
    return "\n".join(parts)


# --- смородина --------------------------------------------------------------


def lobed_leaf(size: float, lobes: int = 5) -> str:
    """Пальчатый лист смородины: округлый, с лопастями и вырезом у черешка.

    Черешок в начале координат, пластина — вправо; вырез основания смотрит на черешок.
    """
    pts: list[Point] = []
    span = math.radians(148)
    steps = 160
    cx = size * 0.88
    for i in range(steps + 1):
        a = -span + 2 * span * i / steps
        r = size * (0.86 + 0.15 * math.cos(lobes * a))
        saw = 2 * abs((i / steps * 30) % 1.0 - 0.5) - 0.5
        r += saw * size * 0.030
        pts.append((math.cos(a) * r + cx, math.sin(a) * r))
    # Основание: от края к вырезу и обратно — сердцевидная выемка у черешка.
    d = catmull_rom(pts, closed=False)
    return d + f" Q {cx * 0.30:.1f} {size * 0.30:.1f} {size * 0.16:.1f} 0" \
               f" Q {cx * 0.30:.1f} {-size * 0.30:.1f} {pts[0][0]:.1f} {pts[0][1]:.1f} Z"


def currant_leaf_group(size: float, x: float, y: float, angle: float) -> str:
    cx = size * 0.88
    veins = "".join(
        stroke(
            f"M {size * 0.16:.1f} 0 L "
            f"{cx + math.cos(a) * size * (0.86 + 0.15 * math.cos(5 * a)) * 0.74:.1f} "
            f"{math.sin(a) * size * (0.86 + 0.15 * math.cos(5 * a)) * 0.74:.1f}",
            W_DETAIL,
            0.46,
        )
        for a in (math.radians(v) for v in (-115, -58, 0, 58, 115))
    )
    return (
        f'<g transform="translate({x:.1f} {y:.1f}) rotate({angle:.1f})">'
        + f'<path d="{lobed_leaf(size)}" fill="url(#flesh)" opacity="0.7"/>'
        + stroke(lobed_leaf(size), W_STEM, 0.9)
        + veins
        + stroke(f"M 0 0 L {size * 0.18:.1f} 0", W_STEM, 0.9)
        + "</g>"
    )


def currant_strig(
    *,
    berries: int = 11,
    r: float = 25.0,
    seed: int = 5,
    shoot: tuple[float, float] = (-136, -262),
    hang: tuple[float, float] = (-4, -212),
    drop: float = 430.0,
    sway: float = 74.0,
    leaf_size: float = 112.0,
    leaf_angle: float = -158.0,
) -> str:
    """Кисть смородины: побег с листом, от него вниз рахис с ягодами.

    Ягоды рисуются от дальней к ближней, рахис уходит под них — иначе сквозь
    полупрозрачную заливку видно линию, и кисть читается как нанизанные бусины.
    """
    sx, sy = CX + shoot[0], CY + shoot[1]
    hx, hy = CX + hang[0], CY + hang[1]
    parts = []

    if leaf_size:
        parts.append(currant_leaf_group(leaf_size, sx, sy, leaf_angle))

    # Побег: от черешка листа к точке подвеса кисти.
    parts.append(
        stroke(
            catmull_rom(
                [(sx, sy), (sx + (hx - sx) * 0.45, sy + 10), (hx, hy)], closed=False
            ),
            W_STEM,
            0.9,
        )
    )

    # Рахис: дуга вниз, к концу отклоняется вбок.
    def rachis(t: float) -> Point:
        return (hx + sway * math.sin(t * 1.5) / math.sin(1.5), hy + drop * t**0.94)

    layers: list[tuple[str, str]] = [
        (
            "M 0 0",
            stroke(catmull_rom([rachis(i / 24) for i in range(25)], closed=False), W_STEM, 0.9),
        )
    ]

    rnd = _rng(seed)
    for i in range(berries):
        t = 0.07 + 0.93 * i / (berries - 1)
        bx, by = rachis(t)
        side = 1 if i % 2 == 0 else -1
        rr = r * (1.00 - 0.24 * t)  # к концу кисти ягоды мельче
        px = bx + side * (rr * 0.92 + rnd() * 6)
        py = by + rr * 1.16
        art = [
            stroke(
                f"M {bx:.1f} {by:.1f} Q {bx + side * rr * 0.5:.1f} {by + rr * 0.44:.1f} "
                f"{px:.1f} {py - rr:.1f}",
                W_HAIR + 0.3,
                0.75,
            ),
            f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr:.1f}" fill="url(#flesh)"/>',
            f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr:.1f}" fill="none" '
            f'stroke="url(#gold)" stroke-width="{W_CONTOUR - 1.0}"/>',
            # Засохшая чашечка снизу — примета смородины.
            stroke(
                f"M {px - rr * 0.24:.1f} {py + rr * 0.90:.1f} "
                f"L {px:.1f} {py + rr * 1.24:.1f} "
                f"L {px + rr * 0.24:.1f} {py + rr * 0.90:.1f}",
                W_HAIR,
                0.6,
            ),
            # Блик.
            stroke(
                f"M {px - rr * 0.50:.1f} {py - rr * 0.28:.1f} "
                f"Q {px - rr * 0.20:.1f} {py - rr * 0.60:.1f} "
                f"{px + rr * 0.22:.1f} {py - rr * 0.52:.1f}",
                W_HAIR,
                0.45,
            ),
        ]
        circle_d = (
            f"M {px - rr:.1f} {py:.1f} a {rr:.1f} {rr:.1f} 0 1 0 {2 * rr:.1f} 0 "
            f"a {rr:.1f} {rr:.1f} 0 1 0 {-2 * rr:.1f} 0 Z"
        )
        layers.append((circle_d, "\n".join(art)))

    parts.append(occlude(layers, gap=W_CONTOUR + 2))
    return "\n".join(parts)
