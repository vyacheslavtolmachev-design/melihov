"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type HoverPrefetchLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

/**
 * Ссылка, которая подгружает страницу при наведении, а не при появлении в поле зрения.
 * Для длинных сеток: в каталоге каждая карточка в поле зрения давала по два запроса к серверу —
 * больше двухсот за одну прокрутку. Приём из документации Next 16
 * (getting-started/linking-and-navigating, «prefetch only on hover»).
 */
export function HoverPrefetchLink({ onMouseEnter, ...props }: HoverPrefetchLinkProps) {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={(event) => {
        setActive(true);
        onMouseEnter?.(event);
      }}
    />
  );
}
