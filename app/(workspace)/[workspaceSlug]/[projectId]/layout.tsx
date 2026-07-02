// app/(workspace)/[workspaceSlug]/[projectId]/layout.tsx
// Шапка проекта (тип, статус, название) + табы по модулям снежинки.

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TabLinkClient } from "@/components/layout/TabLinkClient";
import { ProjectHeaderActions } from "@/components/layout/ProjectHeaderActions";

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

const FICTION_TABS = [
  { key: "", label: "Обзор" },
  { key: "spark", label: "Концепция" },
  { key: "quake", label: "Катастрофы" },
  { key: "cast", label: "Герои" },
  { key: "relations", label: "Связи" },
  { key: "scroll", label: "Синопсис" },
  { key: "thread", label: "Таймлайн" },
  { key: "write", label: "Написание" },
  { key: "ash", label: "Заметки" },
];

const TALK_TABS = [
  { key: "", label: "Обзор" },
  { key: "spark", label: "Концепция" },
  { key: "cast", label: "Герои" },
  { key: "scroll", label: "Синопсис" },
  { key: "thread", label: "Таймлайн" },
  { key: "qa", label: "Вопросы" },
  { key: "materials", label: "Материалы" },
  { key: "ash", label: "Заметки" },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string; projectId: string }>;
}) {
  const { workspaceSlug, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, type, status, meta")
    .eq("id", projectId)
    .single();

  if (!project) {
    notFound();
  }

  const type = TYPE_META[project.type] ?? {
    label: project.type,
    bg: "#eee",
    fg: "#666",
    dot: "#999",
  };
  const base = `/${workspaceSlug}/${projectId}`;

  return (
    <div>
      <div style={{ padding: "32px 44px 0", maxWidth: "1320px" }}>
        <Link
          href={`/${workspaceSlug}`}
          style={{
            color: "var(--ink-dim)",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "18px",
          }}
        >
          ← Все проекты
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
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
            </div>
            <h1
              style={{
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                margin: 0,
              }}
            >
              {project.title}
            </h1>
            {project.meta?.fandom && (
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--ink-dim)",
                  margin: "8px 0 0",
                  maxWidth: "560px",
                  lineHeight: 1.5,
                }}
              >
                {project.meta.fandom}
              </p>
            )}
          </div>
          <ProjectHeaderActions
            projectId={project.id}
            workspaceSlug={workspaceSlug}
            initialStatus={project.status}
          />
        </div>

        <div
          style={{
            display: "inline-flex",
            gap: "4px",
            background: "#EFECE6",
            borderRadius: "14px",
            padding: "5px",
            margin: "26px 0 0",
            flexWrap: "wrap",
          }}
        >
          {(project.type === "talk" ? TALK_TABS : FICTION_TABS).map((t) => (
            <TabLinkClient
              key={t.key}
              href={t.key ? `${base}/${t.key}` : base}
              label={t.label}
              exact={t.key === ""}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "26px 44px 44px", maxWidth: "1320px" }}>
        {children}
      </div>
    </div>
  );
}
