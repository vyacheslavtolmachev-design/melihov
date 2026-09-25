"""Что рисуем для каждого сорта.

Слаг и название берутся из wordpress/catalog/varieties.tsv — источника правды.
Здесь только форма плода и композиция; ничего, что можно принять за характеристику
сорта (срок созревания, регион, вкус), сюда не попадает.
"""

from __future__ import annotations

from draw import Leaf
from fruits import (
    APPLE_CONICAL,
    CHERRY_HEART,
    PEAR_LONG_NECK,
    PLUM_OVAL,
    apple,
    cherry_pair,
    currant_strig,
    pear,
    plum,
)

# Листья по культурам — общая функция, разные пропорции.
LEAF_APPLE = Leaf(length=216, width=62, bend=0.10, teeth=20, tooth=0.060, tip=0.95, base=0.60)
LEAF_PEAR = Leaf(length=200, width=70, bend=0.08, teeth=24, tooth=0.040, tip=0.85, base=0.70)
LEAF_CHERRY = Leaf(length=240, width=56, bend=0.11, teeth=26, tooth=0.050, tip=1.15, base=0.60)
LEAF_PLUM = Leaf(length=206, width=66, bend=0.10, teeth=22, tooth=0.045, tip=0.75, base=0.75)


VARIETIES: dict[str, dict] = {
    # Яблоня. Голден Делишес — вытянутое конической формы, в лентицелях.
    "apple-golden-delishes": {
        "title": "Голден Делишес",
        "alt": "Яблоня Голден Делишес — ботаническая иллюстрация плода с листом",
        "draw": lambda: apple(
            APPLE_CONICAL,
            rx=180,
            ry=202,
            seed=11,
            lenticels=26,
            ribs=3,
            stem_lean=16,
            stem_len=104,
            leaf=LEAF_APPLE,
            leaf_at=(46, -232, -36),
        ),
    },
    # Груша. Аббат Фетель — длинная шейка, тело смещено вниз.
    "pear-abbat-fetel": {
        "title": "Аббат Фетель",
        "alt": "Груша Аббат Фетель — ботаническая иллюстрация плода с листом",
        "draw": lambda: pear(
            PEAR_LONG_NECK,
            rx=142,
            ry=238,
            seed=21,
            lenticels=30,
            stem_lean=22,
            stem_len=86,
            leaf=LEAF_PEAR,
            leaf_at=(-44, -268, -152),
        ),
    },
    # Черешня. Ревна — пара округло-сердцевидных плодов на длинных плодоножках.
    "sweet-cherry-revna": {
        "title": "Ревна",
        "alt": "Черешня Ревна — ботаническая иллюстрация пары плодов с листьями",
        "draw": lambda: cherry_pair(
            CHERRY_HEART,
            r1=104,
            r2=92,
            seed=31,
            junction=(6, -256),
            left=(-116, 104),
            right=(104, 48),
            leaf=LEAF_CHERRY,
            leaf_at=(22, -258, -28),
            leaf2_at=(-10, -250, -152),
        ),
    },
    # Слива. Стенлей — удлинённо-яйцевидная, с выраженным брюшным швом.
    "plum-stenley": {
        "title": "Стенлей",
        "alt": "Слива Стенлей — ботаническая иллюстрация плодов с листом",
        "draw": lambda: plum(
            PLUM_OVAL,
            rx=140,
            ry=196,
            seed=41,
            second=(-158, 96, 0.60),
            stem_lean=18,
            stem_len=92,
            leaf=LEAF_PLUM,
            leaf_at=(62, -222, -34),
        ),
    },
    # Смородина. Ровада — длинная кисть, ягоды к концу мельчают.
    "currant-rovada": {
        "title": "Ровада",
        "alt": "Смородина Ровада — ботаническая иллюстрация кисти ягод с листом",
        "draw": lambda: currant_strig(
            berries=11,
            r=27,
            seed=51,
            shoot=(-128, -256),
            hang=(2, -206),
            drop=418,
            sway=66,
            leaf_size=112,
            leaf_angle=-152,
        ),
    },
}
