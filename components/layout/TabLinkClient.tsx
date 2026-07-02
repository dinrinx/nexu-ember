"use client";

// components/layout/TabLinkClient.tsx
// Один таб в переключателе модулей проекта — подсвечивается, когда путь активен.

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TabLinkClient({
  href,
  label,
  exact,
}: {
  href: string;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      style={{
        border: "none",
        background: active ? "#fff" : "transparent",
        color: active ? "var(--ink)" : "var(--ink-dim)",
        borderRadius: "10px",
        padding: "9px 16px",
        fontSize: "13px",
        fontWeight: 700,
        textDecoration: "none",
        boxShadow: active ? "0 1px 3px rgba(20,20,20,0.08)" : "none",
      }}
    >
      {label}
    </Link>
  );
}
