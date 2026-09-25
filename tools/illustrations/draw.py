"""Примитивы ботанической линейной графики: кривые, лист, ветка, фон сцены.

Единый стиль держится здесь: все сорта пользуются одними и теми же функциями,
различаются только силуэтом плода. Палитра — токены из frontend/app/globals.css.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

# Палитра. Бронзу не светлить — значения совпадают с @theme в globals.css.
BG_TOP = "#26382a"
BG_BOTTOM = "#17231c"
BRONZE = "#b89a6c"

# Металлический градиент обводки — те же стопы, что в GoldDefs.tsx (#goldStroke).
GOLD_STOPS = (
    (0.00, "#f2e4c6"),
    (0.35, "#c5a880"),
    (0.65, "#9c7a4e"),
    (1.00, "#e4cfa8"),
)

# Толщины обводки. Своих значений в рисунках не заводим — берём отсюда.
W_CONTOUR = 4.6  # силуэт плода
W_STEM = 3.4  # плодоножка, ветка
W_DETAIL = 2.2  # жилки, шов, рёбра
W_HAIR = 1.5  # лентицели, точки, штриховка

Point = tuple[float, float]


# --- кривые -----------------------------------------------------------------


def catmull_rom(points: list[Point], closed: bool, tension: float = 6.0) -> str:
    """Гладкая кривая через точки. Catmull-Rom, переведённый в кубические Безье."""
    n = len(points)
    if n < 2:
        return ""

    def at(i: int) -> Point:
        if closed:
            return points[i % n]
        return points[min(max(i, 0), n - 1)]

    segments = n if closed else n - 1
    d = [f"M {points[0][0]:.2f} {points[0][1]:.2f}"]
    for i in range(segments):
        p0, p1, p2, p3 = at(i - 1), at(i), at(i + 1), at(i + 2)
        c1 = (p1[0] + (p2[0] - p0[0]) / tension, p1[1] + (p2[1] - p0[1]) / tension)
        c2 = (p2[0] - (p3[0] - p1[0]) / tension, p2[1] - (p3[1] - p1[1]) / tension)
        d.append(
            f"C {c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]:.2f} {p2[1]:.2f}"
        )
    if closed:
        d.append("Z")
    return " ".join(d)


def mirror(profile: list[Point]) -> list[Point]:
    """Правый полупрофиль (сверху вниз) → замкнутый контур.

    Крайние точки профиля лежат на оси симметрии и в зеркальную половину не идут,
    иначе в вершине и в донце появляется излом.
    """
    left = [(-x, y) for x, y in reversed(profile[1:-1])]
    return profile + left


def scale(points: list[Point], sx: float, sy: float, dx: float = 0, dy: float = 0):
    return [(x * sx + dx, y * sy + dy) for x, y in points]


# --- лист -------------------------------------------------------------------


@dataclass
class Leaf:
    """Лист как набор параметров: длина, ширина, изгиб, зубчики, острота кончика."""

    length: float
    width: float
    bend: float = 0.12  # прогиб средней жилки, доля длины
    teeth: int = 18  # число зубчиков по краю
    tooth: float = 0.06  # глубина зубчика, доля полуширины
    tip: float = 0.90  # показатель у кончика: больше — острее
    base: float = 0.55  # показатель у основания: меньше — основание полнее

    def _halfwidth(self, t: float) -> float:
        """Полуширина листа, 0…1. Асимметричная кривая: полное основание, острый кончик."""
        peak = self.base / (self.base + self.tip)
        norm = peak**self.base * (1 - peak) ** self.tip
        w = (t**self.base) * ((1 - t) ** self.tip) / norm
        # Зубчики — треугольная волна, пропорциональная местной ширине.
        saw = 2 * abs((t * self.teeth) % 1.0 - 0.5) - 0.5
        return w * (1 + saw * self.tooth * (4 * t * (1 - t)) ** 0.5)

    def _spine(self, t: float) -> float:
        return self.bend * self.length * math.sin(math.pi * t)

    def _edge(self, sign: float) -> list[Point]:
        steps = 120
        pts = []
        for i in range(steps + 1):
            t = i / steps
            y = -sign * self._halfwidth(t) * self.width + self._spine(t)
            pts.append((t * self.length, y))
        return pts

    def outline(self) -> str:
        top = self._edge(1.0)
        bottom = list(reversed(self._edge(-1.0)))
        d = [f"M {top[0][0]:.2f} {top[0][1]:.2f}"]
        d += [f"L {x:.2f} {y:.2f}" for x, y in top[1:]]
        d += [f"L {x:.2f} {y:.2f}" for x, y in bottom[1:]]
        d.append("Z")
        return " ".join(d)

    def midrib(self) -> str:
        pts = [(t * self.length, self._spine(t)) for t in (i / 24 for i in range(25))]
        return catmull_rom(pts, closed=False)

    def veins(self, count: int = 5) -> list[str]:
        """Боковые жилки: от средней жилки к краю, наклонённые к кончику."""
        out = []
        for i in range(count):
            t = 0.14 + 0.62 * i / max(count - 1, 1)
            t1 = min(t + 0.12, 0.95)
            x0, y0 = t * self.length, self._spine(t)
            for sign in (1, -1):
                x1 = t1 * self.length
                y1 = self._spine(t1) - sign * self._halfwidth(t1) * self.width * 0.86
                cx = x0 + (x1 - x0) * 0.30
                cy = y0 - sign * self._halfwidth(t) * self.width * 0.62
                out.append(f"M {x0:.2f} {y0:.2f} Q {cx:.2f} {cy:.2f} {x1:.2f} {y1:.2f}")
        return out


def leaf_group(leaf: Leaf, x: float, y: float, angle: float, veins: int = 5) -> str:
    """Лист целиком: контур, средняя жилка, боковые жилки — в стиле всех сортов."""
    parts = [f'<g transform="translate({x:.1f} {y:.1f}) rotate({angle:.1f})">']
    parts.append(_stroke(leaf.outline(), W_STEM, 0.92))
    parts.append(_stroke(leaf.midrib(), W_DETAIL, 0.72))
    for v in leaf.veins(veins):
        parts.append(_stroke(v, W_HAIR, 0.45))
    parts.append("</g>")
    return "\n".join(parts)


# --- обводка ----------------------------------------------------------------


EXTRA_DEFS: list[str] = []


def add_def(fragment: str) -> None:
    EXTRA_DEFS.append(fragment)


def take_defs() -> str:
    out = "".join(EXTRA_DEFS)
    EXTRA_DEFS.clear()
    return out


def behind(back: str, front_d: str, gap: float = W_CONTOUR + 5) -> str:
    """Прячет часть заднего плана под передним контуром.

    Заливка плодов полупрозрачная, поэтому просто нарисовать один поверх другого
    нельзя — линии просвечивают. Вырезаем из заднего силуэт переднего с зазором.
    """
    name = f"cut{len(EXTRA_DEFS)}"
    add_def(
        f'<mask id="{name}" maskUnits="userSpaceOnUse" x="0" y="0" '
        f'width="{WIDTH}" height="{HEIGHT}">'
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="#fff"/>'
        f'<path d="{front_d}" fill="#000" stroke="#000" stroke-width="{gap}" '
        f'stroke-linejoin="round"/>'
        "</mask>"
    )
    return f'<g mask="url(#{name})">{back}</g>'


def occlude(layers: list[tuple[str, str]], gap: float = W_CONTOUR + 4) -> str:
    """Слои от дальнего к ближнему: (силуэт, разметка). Каждый прячется под всеми ближними."""
    out = []
    for i, (_, art) in enumerate(layers):
        fronts = [d for d, _ in layers[i + 1 :]]
        if not fronts:
            out.append(art)
            continue
        name = f"occ{len(EXTRA_DEFS)}"
        cuts = "".join(
            f'<path d="{d}" fill="#000" stroke="#000" stroke-width="{gap}" '
            f'stroke-linejoin="round"/>'
            for d in fronts
        )
        add_def(
            f'<mask id="{name}" maskUnits="userSpaceOnUse" x="0" y="0" '
            f'width="{WIDTH}" height="{HEIGHT}">'
            f'<rect width="{WIDTH}" height="{HEIGHT}" fill="#fff"/>{cuts}</mask>'
        )
        out.append(f'<g mask="url(#{name})">{art}</g>')
    return "\n".join(out)


def _stroke(d: str, width: float, opacity: float = 1.0, dash: str | None = None) -> str:
    extra = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<path d="{d}" fill="none" stroke="url(#gold)" stroke-width="{width}" '
        f'stroke-linecap="round" stroke-linejoin="round" opacity="{opacity}"{extra}/>'
    )


def stroke(d: str, width: float, opacity: float = 1.0, dash: str | None = None) -> str:
    return _stroke(d, width, opacity, dash)


def dot(x: float, y: float, r: float, opacity: float = 0.5) -> str:
    return (
        f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="none" '
        f'stroke="url(#gold)" stroke-width="{W_HAIR}" opacity="{opacity}"/>'
    )


def fill_dot(x: float, y: float, r: float, opacity: float = 0.35) -> str:
    return f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="{BRONZE}" opacity="{opacity}"/>'


# --- сцена ------------------------------------------------------------------

WIDTH, HEIGHT = 800, 1000
# Центр композиции. Карточка каталога режет кадр по 4:5, страница сорта — по 4:3
# (видна полоса y 200…800), а низ карточки закрывает подпись. Плод держим здесь.
CX, CY = 400, 440
RING = 232


def defs() -> str:
    stops = "".join(
        f'<stop offset="{o * 100:.0f}%" stop-color="{c}"/>' for o, c in GOLD_STOPS
    )
    return f"""<defs>
    <linearGradient id="gold" x1="8%" y1="0%" x2="92%" y2="100%">{stops}</linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{BG_TOP}"/>
      <stop offset="62%" stop-color="#1e2c23"/>
      <stop offset="100%" stop-color="{BG_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="{CY / HEIGHT * 100:.0f}%" r="52%">
      <stop offset="0%" stop-color="{BRONZE}" stop-opacity="0.16"/>
      <stop offset="55%" stop-color="{BRONZE}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="{BRONZE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="46%" r="72%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0b140f" stop-opacity="0.55"/>
    </radialGradient>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{BG_BOTTOM}" stop-opacity="0"/>
      <stop offset="100%" stop-color="#131d17" stop-opacity="0.92"/>
    </linearGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>"""


def background() -> str:
    """Фон: градиент, бронзовый halo, медальонные кольца, виньетка."""
    return f"""<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#ground)"/>
  <rect width="{WIDTH}" height="{HEIGHT}" fill="url(#halo)"/>
  <circle cx="{CX}" cy="{CY}" r="{RING}" fill="none" stroke="{BRONZE}" stroke-width="1.6" opacity="0.24"/>"""


def foreground() -> str:
    """Верхние слои: виньетка, скрим под подпись карточки, зерно ~4 %."""
    return f"""<rect width="{WIDTH}" height="{HEIGHT}" fill="url(#vignette)"/>
  <rect x="0" y="600" width="{WIDTH}" height="400" fill="url(#scrim)"/>
  <rect width="{WIDTH}" height="{HEIGHT}" filter="url(#grain)" opacity="0.05"/>"""


def scene(body: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}"
     viewBox="0 0 {WIDTH} {HEIGHT}">
  {defs()}
  {background()}
  <g>
{body}
  </g>
  {foreground()}
</svg>
"""
