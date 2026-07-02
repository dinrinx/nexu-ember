// app/(workspace)/[workspaceSlug]/page.tsx
// Дашборд воркспейса: карточки статистики + сетка проектов, по редизайну.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TYPE_META: Record<
  string,
  { label: string; bg: string; fg: string; dot: string }
> = {
  fanfic: {
    label: "Фанфик",
    bg: "var(--type-fanfic-bg)",
    fg: "var(--type-fanfic-fg)",
    dot: "var(--type-fanfic-dot)",
  },
  book: {
    label: "Книга",
    bg: "var(--type-book-bg)",
    fg: "var(--type-book-fg)",
    dot: "var(--type-book-dot)",
  },
  talk: {
    label: "Выступление",
    bg: "var(--type-talk-bg)",
    fg: "var(--type-talk-fg)",
    dot: "var(--type-talk-dot)",
  },
};

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  draft: {
    label: "Черновик",
    bg: "var(--status-draft-bg)",
    fg: "var(--status-draft-fg)",
  },
  in_progress: {
    label: "В работе",
    bg: "var(--status-progress-bg)",
    fg: "var(--status-progress-fg)",
  },
  done: {
    label: "Готово",
    bg: "var(--status-done-bg)",
    fg: "var(--status-done-fg)",
  },
  archived: { label: "Архив", bg: "#EEEBE4", fg: "#8A8A85" },
};

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, type, status, meta")
    .eq("workspace_id", workspace?.id)
    .order("updated_at", { ascending: false });

  const list = projects ?? [];
  const counts = {
    fanfic: list.filter((p) => p.type === "fanfic").length,
    book: list.filter((p) => p.type === "book").length,
    talk: list.filter((p) => p.type === "talk").length,
  };

  const greetingName = user?.email?.split("@")[0] ?? "";

  return (
    <div style={{ padding: "36px 44px", maxWidth: "1120px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.4px",
              color: "var(--ink-faint)",
              marginBottom: "8px",
            }}
          >
            {workspace?.name}
          </div>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            Добрый день{greetingName ? `, ${greetingName}` : ""}
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--ink-dim)",
              margin: "8px 0 0",
            }}
          >
            Продолжите работу над замыслами или начните новый.
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/new`}
          style={{
            background: "var(--black)",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "13px 22px",
            fontWeight: 700,
            fontSize: "14px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          + Новый проект
        </Link>
      </div>

      {/* карточки статистики */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "var(--sidebar-bg)",
            color: "var(--sidebar-ink)",
            borderRadius: "20px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: "var(--sidebar-ink-dim)",
            }}
          >
            Всего проектов
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "10px",
              marginTop: "14px",
            }}
          >
            <span
              style={{
                fontSize: "44px",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-1px",
              }}
            >
              {list.length}
            </span>
            <span
              style={{
                fontSize: "13px",
                color: "var(--sidebar-ink-dim)",
                paddingBottom: "6px",
              }}
            >
              активных
            </span>
          </div>
        </div>

        {(["fanfic", "book", "talk"] as const).map((t) => (
          <div
            key={t}
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "22px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "999px",
                background: TYPE_META[t].bg,
                color: TYPE_META[t].fg,
              }}
            >
              {TYPE_META[t].label}
            </span>
            <div
              style={{
                fontSize: "32px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                marginTop: "16px",
              }}
            >
              {counts[t]}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "var(--ink-faint)",
          marginBottom: "14px",
        }}
      >
        Ваши проекты
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "18px",
        }}
      >
        {list.map((p) => {
          const type = TYPE_META[p.type] ?? {
            label: p.type,
            bg: "#eee",
            fg: "#666",
            dot: "#999",
          };
          const st = STATUS_META[p.status] ?? {
            label: p.status,
            bg: "#eee",
            fg: "#666",
          };
          return (
            <Link
              key={p.id}
              href={`/${workspaceSlug}/${p.id}`}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                minHeight: "172px",
                textDecoration: "none",
                color: "var(--ink)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "5px 11px",
                    borderRadius: "999px",
                    background: type.bg,
                    color: type.fg,
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: type.dot,
                    }}
                  />
                  {type.label}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "5px 11px",
                    borderRadius: "999px",
                    background: st.bg,
                    color: st.fg,
                  }}
                >
                  {st.label}
                </span>
              </div>
              <h2
                style={{
                  fontSize: "19px",
                  fontWeight: 700,
                  letterSpacing: "-0.3px",
                  margin: "0 0 8px",
                }}
              >
                {p.title || "без названия"}
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.55,
                  color: "var(--ink-dim)",
                  margin: 0,
                  flex: 1,
                }}
              >
                {p.meta?.fandom || p.meta?.tagline || "—"}
              </p>
            </Link>
          );
        })}

        <Link
          href={`/${workspaceSlug}/new`}
          style={{
            border: "2px dashed var(--border-strong)",
            background: "transparent",
            borderRadius: "20px",
            padding: "22px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            minHeight: "172px",
            color: "var(--ink-faint)",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#F0EDE6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            +
          </span>
          <span style={{ fontSize: "14px", fontWeight: 700 }}>
            Новый проект
          </span>
        </Link>
      </div>
    </div>
  );
}
