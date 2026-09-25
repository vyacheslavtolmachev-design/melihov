/**
 * Общие градиенты золота. Рендерятся один раз в layout,
 * чтобы иконки Lucide ссылались через stroke="url(#goldStroke)".
 */
export function GoldDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f2e4c6" />
          <stop offset="35%" stopColor="#c5a880" />
          <stop offset="65%" stopColor="#9c7a4e" />
          <stop offset="100%" stopColor="#e4cfa8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
