/**
 * Геометрия ботанических гравюр на полях страницы: ветвь яблони слева, вишни справа.
 * Всё — контуры без заливки в системе координат 400×1000. Модуль без React,
 * чтобы превью можно было отрисовать вне Next.js.
 */

export type OrnamentPath = { d: string; weight?: "main" | "fine" };

const f = (n: number) => Number(n.toFixed(1));

function rotate(x: number, y: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/** Переводит локальные точки фигуры в координаты холста. */
function place(ox: number, oy: number, deg: number) {
  return (x: number, y: number) => {
    const [rx, ry] = rotate(x, y, deg);
    return `${f(ox + rx)} ${f(oy + ry)}`;
  };
}

/**
 * Лист: черешок, контур с лёгким изгибом, центральная жилка и три пары боковых.
 * `bend` > 0 изгибает лист по часовой стрелке относительно направления роста.
 */
export function leaf(x: number, y: number, deg: number, len: number, bend = 0.12): OrnamentPath[] {
  const p = place(x, y, deg);
  const w = len * 0.3;
  const stalk = len * 0.14;
  const b = len * bend;
  const tipX = stalk + len;

  const outline =
    `M${p(stalk, 0)} ` +
    `C${p(stalk + len * 0.22, -w * 1.05)} ${p(stalk + len * 0.72, -w * 0.8 + b * 0.6)} ${p(tipX, b)} ` +
    `C${p(stalk + len * 0.7, w * 0.95 + b * 0.8)} ${p(stalk + len * 0.2, w * 0.9)} ${p(stalk, 0)}Z`;

  const midrib = `M${p(0, 0)} Q${p(stalk + len * 0.5, b * 0.35)} ${p(tipX - len * 0.05, b * 0.95)}`;

  const veins: string[] = [];
  for (const t of [0.24, 0.44, 0.64]) {
    const vx = stalk + len * t;
    const vy = b * t * t * 0.9;
    const reach = w * 0.62 * Math.sin(Math.PI * (t * 0.85 + 0.08));
    veins.push(`M${p(vx, vy)} Q${p(vx + len * 0.06, vy - reach * 0.6)} ${p(vx + len * 0.14, vy - reach + b * 0.1)}`);
    veins.push(`M${p(vx, vy)} Q${p(vx + len * 0.06, vy + reach * 0.6)} ${p(vx + len * 0.14, vy + reach + b * 0.1)}`);
  }

  return [{ d: outline, weight: "main" }, { d: midrib }, ...veins.map((d) => ({ d, weight: "fine" as const }))];
}

/** Яблоко с плодоножкой, воронкой у черешка и штриховкой тени. */
export function apple(x: number, y: number, r: number, deg = 0): OrnamentPath[] {
  const p = place(x, y, deg);
  const body =
    `M${p(0, -r * 0.72)} ` +
    `C${p(r * 0.42, -r * 1.08)} ${p(r * 1.08, -r * 0.92)} ${p(r * 1.04, -r * 0.12)} ` +
    `C${p(r * 1.0, r * 0.62)} ${p(r * 0.52, r * 1.02)} ${p(r * 0.12, r * 0.96)} ` +
    `C${p(r * 0.04, r * 0.94)} ${p(-r * 0.04, r * 0.94)} ${p(-r * 0.12, r * 0.96)} ` +
    `C${p(-r * 0.52, r * 1.02)} ${p(-r * 1.0, r * 0.62)} ${p(-r * 1.04, -r * 0.12)} ` +
    `C${p(-r * 1.08, -r * 0.92)} ${p(-r * 0.42, -r * 1.08)} ${p(0, -r * 0.72)}Z`;

  const cavity = `M${p(-r * 0.3, -r * 0.8)} Q${p(0, -r * 0.5)} ${p(r * 0.3, -r * 0.8)}`;
  const stem = `M${p(0, -r * 0.6)} C${p(r * 0.02, -r * 0.95)} ${p(r * 0.1, -r * 1.2)} ${p(r * 0.24, -r * 1.42)}`;
  const calyx = `M${p(-r * 0.1, r * 0.82)} L${p(0, r * 0.9)} L${p(r * 0.1, r * 0.82)}`;
  const highlight = `M${p(-r * 0.66, -r * 0.46)} Q${p(-r * 0.78, -r * 0.1)} ${p(-r * 0.62, r * 0.22)}`;

  const hatch: OrnamentPath[] = [];
  for (let i = 0; i < 5; i += 1) {
    const s = 0.28 + i * 0.13;
    hatch.push({
      d: `M${p(r * s, -r * (0.62 - i * 0.05))} Q${p(r * (s + 0.2), r * 0.1)} ${p(r * (s - 0.04), r * (0.7 - i * 0.04))}`,
      weight: "fine",
    });
  }

  return [
    { d: body, weight: "main" },
    { d: cavity },
    { d: stem, weight: "main" },
    { d: calyx, weight: "fine" },
    { d: highlight, weight: "fine" },
    ...hatch,
  ];
}

/** Вишня: круглый плод с ямкой у плодоножки и бликом. */
export function cherry(x: number, y: number, r: number): OrnamentPath[] {
  const p = place(x, y, 0);
  const body =
    `M${p(0, -r * 0.78)} ` +
    `C${p(r * 0.5, -r * 1.12)} ${p(r * 1.06, -r * 0.62)} ${p(r * 1.0, r * 0.06)} ` +
    `C${p(r * 0.94, r * 0.7)} ${p(r * 0.46, r * 1.02)} ${p(0, r * 1.0)} ` +
    `C${p(-r * 0.46, r * 1.02)} ${p(-r * 0.94, r * 0.7)} ${p(-r * 1.0, r * 0.06)} ` +
    `C${p(-r * 1.06, -r * 0.62)} ${p(-r * 0.5, -r * 1.12)} ${p(0, -r * 0.78)}Z`;
  const shine = `M${p(-r * 0.58, -r * 0.3)} Q${p(-r * 0.52, -r * 0.62)} ${p(-r * 0.2, -r * 0.68)}`;
  const hatch = [0.3, 0.5, 0.7].map((s) => ({
    d: `M${p(r * s, -r * 0.5)} Q${p(r * (s + 0.18), r * 0.15)} ${p(r * (s - 0.1), r * 0.72)}`,
    weight: "fine" as const,
  }));
  return [{ d: body, weight: "main" }, { d: shine, weight: "fine" }, ...hatch];
}

/** Почка на конце побега. */
export function bud(x: number, y: number, deg: number, len: number): OrnamentPath[] {
  const p = place(x, y, deg);
  const w = len * 0.32;
  return [
    {
      d: `M${p(0, 0)} C${p(len * 0.3, -w)} ${p(len * 0.8, -w * 0.5)} ${p(len, 0)} C${p(len * 0.8, w * 0.5)} ${p(len * 0.3, w)} ${p(0, 0)}Z`,
      weight: "main",
    },
    { d: `M${p(len * 0.2, 0)} Q${p(len * 0.55, -w * 0.2)} ${p(len * 0.9, 0)}`, weight: "fine" },
  ];
}

type Pt = readonly [number, number];
type Cubic = readonly [Pt, Pt, Pt, Pt];

/** Побег — цепочка кубических сегментов; точки на нём адресуются долей длины u ∈ [0, 1]. */
class Shoot {
  private readonly segs: Cubic[];

  constructor(segs: Cubic[]) {
    this.segs = segs;
  }

  static from(start: Pt, ...rest: [Pt, Pt, Pt][]) {
    const segs: Cubic[] = [];
    let p0 = start;
    for (const [c1, c2, p3] of rest) {
      segs.push([p0, c1, c2, p3]);
      p0 = p3;
    }
    return new Shoot(segs);
  }

  /** Точка и угол касательной (в градусах) на доле u побега. */
  at(u: number): { x: number; y: number; deg: number } {
    const k = Math.min(this.segs.length - 1, Math.floor(u * this.segs.length));
    const t = u * this.segs.length - k;
    const [a, b, c, d] = this.segs[k];
    const mt = 1 - t;
    const x = mt ** 3 * a[0] + 3 * mt * mt * t * b[0] + 3 * mt * t * t * c[0] + t ** 3 * d[0];
    const y = mt ** 3 * a[1] + 3 * mt * mt * t * b[1] + 3 * mt * t * t * c[1] + t ** 3 * d[1];
    const dx = 3 * mt * mt * (b[0] - a[0]) + 6 * mt * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
    const dy = 3 * mt * mt * (b[1] - a[1]) + 6 * mt * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
    return { x, y, deg: (Math.atan2(dy, dx) * 180) / Math.PI };
  }

  path(offset = 0): string {
    const [a] = this.segs[0];
    const o = (q: Pt) => `${f(q[0] + offset)} ${f(q[1])}`;
    return `M${o(a)} ` + this.segs.map(([, b, c, d]) => `C${o(b)} ${o(c)} ${o(d)}`).join(" ");
  }

  /** Лист на побеге: side = 1 справа по ходу роста, −1 слева. */
  leaf(u: number, side: 1 | -1, len: number, spread = 52): OrnamentPath[] {
    const { x, y, deg } = this.at(u);
    return leaf(x, y, deg + side * spread, len, side * 0.12);
  }

  bud(len: number): OrnamentPath[] {
    const { x, y, deg } = this.at(1);
    return bud(x, y, deg, len);
  }

  /** Плодоножка из доли u: уходит в сторону на dx и свисает на drop. Возвращает путь и точку подвеса. */
  hang(u: number, dx: number, drop: number): { path: OrnamentPath; x: number; y: number } {
    const { x, y } = this.at(u);
    const ex = x + dx;
    const ey = y + drop;
    return {
      path: { d: `M${f(x)} ${f(y)} C${f(x + dx * 0.55)} ${f(y + drop * 0.05)} ${f(ex)} ${f(y + drop * 0.45)} ${f(ex)} ${f(ey)}`, weight: "main" },
      x: ex,
      y: ey,
    };
  }

  /** Боковой побег из доли u: направление — угол от касательной, длина, изгиб. */
  twig(u: number, turn: number, len: number, curl = 0.25): Shoot {
    const { x, y, deg } = this.at(u);
    const [dx, dy] = rotate(len, 0, deg + turn);
    const [nx, ny] = rotate(0, len * curl, deg + turn);
    return Shoot.from(
      [x, y],
      [
        [x + dx * 0.35, y + dy * 0.35],
        [x + dx * 0.7 + nx, y + dy * 0.7 + ny],
        [x + dx + nx * 0.6, y + dy + ny * 0.6],
      ],
    );
  }
}

/** Ветвь яблони: входит из-за левого края, спускается дугой, на ней листья и два плода. */
export function appleBranch(): OrnamentPath[] {
  const main = Shoot.from(
    [-24, 110],
    [[70, 118], [150, 170], [204, 256]],
    [[258, 342], [286, 470], [270, 610]],
    [[256, 730], [236, 800], [252, 900]],
  );
  const upper = main.twig(0.14, -58, 150, -0.18);
  const right = main.twig(0.44, -52, 120, 0.2);
  const lower = main.twig(0.68, 60, 110, -0.2);
  const tail = main.twig(0.86, -48, 90, 0.2);

  const a1 = main.hang(0.3, -46, 62);
  const a2 = main.hang(0.6, -58, 58);

  return [
    { d: main.path(), weight: "main" },
    { d: main.path(-9), weight: "fine" },
    ...[upper, right, lower, tail].map((s) => ({ d: s.path(), weight: "main" as const })),
    a1.path,
    a2.path,

    ...upper.bud(24),
    ...right.bud(22),
    ...lower.bud(20),
    ...tail.bud(18),

    ...main.leaf(0.05, -1, 70),
    ...main.leaf(0.09, 1, 78, 64),
    ...upper.leaf(0.45, -1, 62),
    ...upper.leaf(0.6, 1, 58),
    ...upper.leaf(0.85, -1, 54, 38),
    ...main.leaf(0.22, -1, 74),
    ...main.leaf(0.37, -1, 84, 60),
    ...right.leaf(0.5, 1, 60),
    ...right.leaf(0.75, -1, 52),
    ...main.leaf(0.52, 1, 70, 60),
    ...main.leaf(0.58, -1, 76),
    ...lower.leaf(0.55, -1, 58),
    ...lower.leaf(0.8, 1, 52),
    ...main.leaf(0.76, -1, 66),
    ...main.leaf(0.8, 1, 62, 64),
    ...tail.leaf(0.45, -1, 48),
    ...main.leaf(0.97, -1, 50, 30),

    ...apple(a1.x, a1.y + 42 * 0.72, 42, -6),
    ...apple(a2.x, a2.y + 30 * 0.72, 30, 8),
  ];
}

/** Ветвь вишни: входит из-за правого края снизу и поднимается вверх, на побеге две пары ягод. */
export function cherryBranch(): OrnamentPath[] {
  const main = Shoot.from(
    [424, 930],
    [[330, 904], [248, 850], [196, 764]],
    [[144, 678], [128, 560], [150, 432]],
    [[170, 318], [204, 214], [176, 110]],
  );
  const low = main.twig(0.1, 62, 140, 0.18);
  const mid = main.twig(0.46, 58, 110, -0.2);
  const top = main.twig(0.74, -56, 100, 0.2);

  /** Пара ягод на общем узле: плодоножки расходятся вилкой и свисают. */
  const pair = (u: number, drop: number, r: number): OrnamentPath[] => {
    const a = main.hang(u, -r * 1.5, drop);
    const b = main.hang(u, r * 1.3, drop * 1.12);
    return [a.path, b.path, ...cherry(a.x, a.y + r * 0.78, r), ...cherry(b.x, b.y + r * 0.78, r * 1.06)];
  };

  return [
    { d: main.path(), weight: "main" },
    { d: main.path(9), weight: "fine" },
    ...[low, mid, top].map((s) => ({ d: s.path(), weight: "main" as const })),

    ...main.bud(26),
    ...low.bud(22),
    ...mid.bud(20),
    ...top.bud(20),

    ...main.leaf(0.05, 1, 74),
    ...low.leaf(0.45, -1, 62),
    ...low.leaf(0.7, 1, 56),
    ...main.leaf(0.2, -1, 78, 60),
    ...main.leaf(0.3, 1, 70),
    ...mid.leaf(0.5, 1, 56),
    ...mid.leaf(0.75, -1, 50),
    ...main.leaf(0.54, -1, 68),
    ...main.leaf(0.57, 1, 64, 64),
    ...top.leaf(0.5, -1, 54),
    ...top.leaf(0.78, 1, 50),
    ...main.leaf(0.84, -1, 60),
    ...main.leaf(0.92, 1, 54, 44),

    ...pair(0.4, 74, 22),
    ...pair(0.72, 60, 19),
  ];
}
