"use client";

// components/forms/NewProjectForm.tsx
// Форма создания проекта по редизайну: карточки типа с цветной иконкой,
// пилюли статуса, чёрная кнопка отправки + отмена.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TYPE_OPTIONS = [
  {
    value: "fanfic",
    label: "Фанфик",
    hint: "По вселенной канона",
    bg: "var(--type-fanfic-bg)",
  },
  {
    value: "book",
    label: "Книга",
    hint: "Оригинальная история",
    bg: "var(--type-book-bg)",
  },
  {
    value: "talk",
    label: "Выступление",
    hint: "Доклад или лекция",
    bg: "var(--type-talk-bg)",
  },
];

const STATUS_OPTIONS = [
  {
    value: "draft",
    label: "Черновик",
    bg: "var(--status-draft-bg)",
    fg: "var(--status-draft-fg)",
  },
  {
    value: "in_progress",
    label: "В работе",
    bg: "var(--status-progress-bg)",
    fg: "var(--status-progress-fg)",
  },
  {
    value: "done",
    label: "Готово",
    bg: "var(--status-done-bg)",
    fg: "var(--status-done-fg)",
  },
];

export function NewProjectForm({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("fanfic");
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSaving(true);
    setError("");

    const supabase = createClient();

    const { data: template } = await supabase
      .from("templates")
      .select("id")
      .eq("project_type", type)
      .eq("is_default", true)
      .maybeSingle();

    const { data: project, error: err } = await supabase
      .from("projects")
      .insert({
        workspace_id: workspaceId,
        type,
        status,
        title: title.trim() || "Без названия",
        template_id: template?.id ?? null,
      })
      .select("id")
      .single();

    if (err || !project) {
      setSaving(false);
      setError(err?.message ?? "Не получилось создать проект");
      return;
    }

    router.push(`/${workspaceSlug}/${project.id}`);
    router.refresh();
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <label style={labelStyle}>Название проекта</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Например: Тихий картограф"
        style={{
          width: "100%",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "14px 16px",
          fontSize: "16px",
          background: "var(--bg-page)",
          outline: "none",
          marginBottom: "28px",
          fontFamily: "var(--font-sans)",
          color: "var(--ink)",
        }}
      />

      <label style={labelStyle}>Тип проекта</label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        {TYPE_OPTIONS.map((t) => {
          const selected = type === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              style={{
                border: `2px solid ${selected ? "var(--black)" : "var(--border)"}`,
                background: selected ? "var(--bg-page)" : "#fff",
                borderRadius: "16px",
                padding: "18px 14px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: t.bg,
                  marginBottom: "14px",
                }}
              />
              <span
                style={{
                  display: "block",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {t.label}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "var(--ink-dim)",
                  marginTop: "2px",
                }}
              >
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      <label style={labelStyle}>Статус</label>
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "32px",
          flexWrap: "wrap",
        }}
      >
        {STATUS_OPTIONS.map((s) => {
          const selected = status === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              style={{
                border: `1px solid ${selected ? s.fg : "var(--border)"}`,
                background: selected ? s.bg : "#fff",
                color: selected ? s.fg : "var(--ink-dim)",
                borderRadius: "999px",
                padding: "9px 16px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "var(--font-sans)",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: "var(--black)",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "14px 28px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            opacity: saving ? 0.7 : 1,
            fontFamily: "var(--font-sans)",
          }}
        >
          {saving ? "Создаю…" : "Создать проект"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${workspaceSlug}`)}
          style={{
            background: "#fff",
            color: "var(--ink)",
            border: "1px solid var(--border)",
            borderRadius: "999px",
            padding: "14px 24px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Отмена
        </button>
      </div>

      {error && (
        <p style={{ fontSize: "13px", color: "#c0392b", marginTop: "14px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  color: "var(--ink-faint)",
  display: "block",
  marginBottom: "12px",
};
