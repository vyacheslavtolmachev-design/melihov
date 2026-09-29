import { appleBranch, cherryBranch, type OrnamentPath } from "./side-ornaments.geometry";

/** Толщина линий в экранных пикселях: гравюра масштабируется под ширину поля, штрих — нет. */
const strokeWidth: Record<NonNullable<OrnamentPath["weight"]> | "default", number> = {
  main: 1.25,
  default: 0.95,
  fine: 0.6,
};

const left = appleBranch();
const right = cherryBranch();

function Branch({ paths, gradientId }: { paths: OrnamentPath[]; gradientId: string }) {
  return (
    <>
      <defs>
        {/* userSpaceOnUse: у прямых штрихов нулевая высота рамки, и градиент по рамке их бы не отрисовал */}
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="1000">
          <stop offset="0%" stopColor="#f2e4c6" />
          <stop offset="35%" stopColor="#c5a880" />
          <stop offset="65%" stopColor="#9c7a4e" />
          <stop offset="100%" stopColor="#e4cfa8" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#${gradientId})`} strokeLinecap="round" strokeLinejoin="round">
        {paths.map((path, index) => (
          <path
            key={index}
            d={path.d}
            strokeWidth={strokeWidth[path.weight ?? "default"]}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </>
  );
}

/**
 * Ботанические гравюры на свободных полях по бокам колонки `.shell`:
 * ветвь яблони сверху слева, вишни снизу справа. Только на широких экранах (см. globals.css).
 */
export function SideOrnaments() {
  return (
    <div aria-hidden="true" className="side-ornaments">
      <svg className="side-ornament side-ornament--left" viewBox="0 0 400 1000" preserveAspectRatio="xMinYMin meet">
        <Branch paths={left} gradientId="ornamentGoldLeft" />
      </svg>
      <svg className="side-ornament side-ornament--right" viewBox="0 0 400 1000" preserveAspectRatio="xMaxYMax meet">
        <Branch paths={right} gradientId="ornamentGoldRight" />
      </svg>
    </div>
  );
}
