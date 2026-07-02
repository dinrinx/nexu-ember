"use client";

// components/layout/ProjectHeaderActions.tsx
// Интерактивный статус проекта (выпадающий список) + удаление проекта.

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

export function ProjectHeaderActions({
  projectId,
  workspaceSlug,
  initialStatus,
}: {
  projectId: string;
  workspaceSlug: string;
  initialStatus: string;
}) {
  const router = useRouter();

  async function changeStatus(next: string) {
    const supabase = createClient();
    await supabase
      .from("projects")
      .update({ status: next })
      .eq("id", projectId);
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        "Удалить проект без возможности отмены? Все герои, катастрофы, синопсис и таймлайн будут удалены вместе с ним.",
      )
    )
      return;
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", projectId);
    router.push(`/${workspaceSlug}`);
    router.refresh();
  }

  const meta = STATUS_META[initialStatus] ?? STATUS_META.draft;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <select
        value={initialStatus}
        onChange={(e) => changeStatus(e.target.value)}
        style={{
          appearance: "none",
          border: "none",
          borderRadius: "999px",
          padding: "5px 26px 5px 11px",
          fontSize: "11px",
          fontWeight: 700,
          background: `${meta.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6' fill='${encodeURIComponent(meta.fg)}'/%3E%3C/svg%3E") no-repeat right 10px center`,
          color: meta.fg,
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        {Object.entries(STATUS_META).map(([value, m]) => (
          <option key={value} value={value}>
            {m.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleDelete}
        title="Удалить проект"
        style={{
          border: "1px solid var(--border)",
          background: "#fff",
          color: "var(--ink-faint)",
          borderRadius: "999px",
          width: "28px",
          height: "28px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        ✕
      </button>
    </div>
  );
}
