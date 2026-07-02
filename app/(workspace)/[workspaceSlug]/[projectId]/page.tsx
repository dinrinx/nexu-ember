// app/(workspace)/[workspaceSlug]/[projectId]/page.tsx
// Обзор проекта: прогресс по методу снежинки + карточки-превью модулей.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const FICTION_MODULES = [
  { key: "spark", label: "Концепция", types: ["concept"] },
  { key: "quake", label: "Катастрофы", types: ["disaster"] },
  { key: "cast", label: "Герои", types: ["character"] },
  { key: "relations", label: "Связи", types: ["__links__"] },
  { key: "scroll", label: "Синопсис", types: ["synopsis"] },
  { key: "thread", label: "Таймлайн", types: ["timeline_event"] },
  { key: "write", label: "Написание", types: ["__blocks__"] },
  { key: "ash", label: "Заметки", types: ["notes"] },
];

const TALK_MODULES = [
  { key: "spark", label: "Концепция", types: ["concept"] },
  { key: "cast", label: "Герои", types: ["character"] },
  { key: "scroll", label: "Синопсис", types: ["synopsis"] },
  { key: "thread", label: "Таймлайн", types: ["timeline_event"] },
  { key: "qa", label: "Вопросы", types: ["qa"] },
  { key: "materials", label: "Материалы", types: ["material"] },
  { key: "ash", label: "Заметки", types: ["notes"] },
];

export default async function ProjectHubPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>;
}) {
  const { workspaceSlug, projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("type")
    .eq("id", projectId)
    .single();

  const MODULES = project?.type === "talk" ? TALK_MODULES : FICTION_MODULES;

  const { data: cards } = await supabase
    .from("cards")
    .select("id, type")
    .eq("project_id", projectId);

  const { count: timelineCount } = await supabase
    .from("timeline_events")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const cardIds = (cards ?? []).map((c) => c.id);
  const { count: linkCount } = cardIds.length
    ? await supabase
        .from("card_links")
        .select("id", { count: "exact", head: true })
        .in("card_id_a", cardIds)
    : { count: 0 };

  const { count: chapterCount } = await supabase
    .from("blocks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("level", "chapter");

  const cardTypes = new Set((cards ?? []).map((c) => c.type));
  const filled = MODULES.filter((m) => {
    if (m.key === "thread") return (timelineCount ?? 0) > 0;
    if (m.key === "relations") return (linkCount ?? 0) > 0;
    if (m.key === "write") return (chapterCount ?? 0) > 0;
    return m.types.some((t) => cardTypes.has(t));
  });

  return (
    <div>
      <div
        style={{
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-ink)",
          borderRadius: "20px",
          padding: "24px 26px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: "var(--sidebar-ink-dim)",
              marginBottom: "8px",
            }}
          >
            Прогресс по методу снежинки
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "-0.3px",
            }}
          >
            Заполнено {filled.length} из {MODULES.length}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {MODULES.map((m) => (
            <span
              key={m.key}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: filled.includes(m)
                  ? "var(--accent)"
                  : "var(--sidebar-surface-hover)",
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {MODULES.map((m) => {
          const isFilled = filled.includes(m);
          return (
            <Link
              key={m.key}
              href={`/${workspaceSlug}/${projectId}/${m.key}`}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: "18px",
                padding: "20px",
                boxShadow: "var(--shadow-card)",
                textDecoration: "none",
                color: "var(--ink)",
                display: "block",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    letterSpacing: "-0.2px",
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    padding: "4px 9px",
                    borderRadius: "999px",
                    background: isFilled ? "var(--status-done-bg)" : "#F0EDE6",
                    color: isFilled
                      ? "var(--status-done-fg)"
                      : "var(--ink-faint)",
                  }}
                >
                  {isFilled ? "Заполнено" : "Пусто"}
                </span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.55,
                  color: "var(--ink-dim)",
                  margin: 0,
                }}
              >
                {isFilled
                  ? "Открыть и продолжить редактирование"
                  : "Ещё не заполнено — начните здесь"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
