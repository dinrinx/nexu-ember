"use client";

// components/layout/Sidebar.tsx
// Тёмный сайдбар по редизайну: карточка воркспейса, оранжевая кнопка создания,
// список проектов с цветной точкой по типу, футер с юзером.

import Link from "next/link";
import { usePathname } from "next/navigation";

const TYPE_META: Record<string, { label: string; dot: string }> = {
  fanfic: { label: "Фанфик", dot: "var(--type-fanfic-dot)" },
  book: { label: "Книга", dot: "var(--type-book-dot)" },
  talk: { label: "Выступление", dot: "var(--type-talk-dot)" },
};

interface Project {
  id: string;
  title: string;
  type: string;
}

export function Sidebar({
  workspaceName,
  workspaceSlug,
  projects,
  userEmail,
}: {
  workspaceName: string;
  workspaceSlug: string;
  projects: Project[];
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const initial = workspaceName?.[0]?.toUpperCase() ?? "W";
  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "··";

  return (
    <aside
      style={{
        width: "264px",
        flex: "none",
        background: "var(--sidebar-bg)",
        color: "var(--sidebar-ink)",
        display: "flex",
        flexDirection: "column",
        padding: "22px 16px",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "11px",
          padding: "4px 8px 20px",
        }}
      >
        <span
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "var(--accent)",
            display: "inline-block",
            boxShadow: "0 0 0 4px rgba(255,90,31,0.16)",
          }}
        />
        <span
          style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.2px" }}
        >
          NEXU Ember
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "11px",
          width: "100%",
          background: "var(--sidebar-surface)",
          border: "1px solid var(--sidebar-border)",
          borderRadius: "14px",
          padding: "11px 12px",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "9px",
            background: "var(--status-progress-bg)",
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "14px",
            flexShrink: 0,
          }}
        >
          {initial}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {workspaceName}
          </span>
          <span
            style={{
              display: "block",
              fontSize: "11px",
              color: "var(--sidebar-ink-dim)",
            }}
          >
            {projects.length} проект(ов) · воркспейс
          </span>
        </span>
      </div>

      <Link
        href={`/${workspaceSlug}/new`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "100%",
          background: "var(--accent)",
          color: "#fff",
          borderRadius: "12px",
          padding: "12px",
          fontWeight: 700,
          fontSize: "14px",
          textDecoration: "none",
          margin: "6px 0 18px",
        }}
      >
        <span style={{ fontSize: "17px", lineHeight: 1 }}>+</span> Новый проект
      </Link>

      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "#6B6B66",
          padding: "0 8px 10px",
        }}
      >
        Проекты
      </div>

      <div
        className="nx-scroll"
        style={{
          flex: 1,
          overflow: "auto",
          margin: "0 -6px",
          padding: "0 6px",
        }}
      >
        {projects.length === 0 ? (
          <p
            style={{
              fontSize: "13px",
              color: "var(--sidebar-ink-dim)",
              padding: "0 5px",
            }}
          >
            Пока пусто
          </p>
        ) : (
          projects.map((p) => {
            const href = `/${workspaceSlug}/${p.id}`;
            const active = pathname?.startsWith(href);
            const meta = TYPE_META[p.type] ?? { label: p.type, dot: "#8A8A85" };
            return (
              <Link
                key={p.id}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  width: "100%",
                  background: active
                    ? "var(--sidebar-surface-hover)"
                    : "transparent",
                  borderRadius: "12px",
                  padding: "10px 11px",
                  textDecoration: "none",
                  color: "var(--sidebar-ink)",
                  marginBottom: "3px",
                }}
              >
                <span
                  style={{
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: meta.dot,
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.title || "без названия"}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      color: "var(--sidebar-ink-dim)",
                    }}
                  >
                    {meta.label}
                  </span>
                </span>
              </Link>
            );
          })
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid var(--sidebar-surface-hover)",
          paddingTop: "14px",
          marginTop: "10px",
          display: "flex",
          alignItems: "center",
          gap: "11px",
        }}
      >
        <span
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "var(--type-book-bg)",
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "13px",
            flexShrink: 0,
          }}
        >
          {userInitials}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {userEmail ?? ""}
          </span>
        </span>
      </div>
    </aside>
  );
}
