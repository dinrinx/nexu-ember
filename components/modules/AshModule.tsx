"use client";

// components/modules/AshModule.tsx
// Модуль "Заметки": свободный текст + отдельный список источников
// с добавлением/удалением строк.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AshFields {
  notes: string;
  sources: string[];
}

export function AshModule({
  projectId,
  cardId,
  initial,
}: {
  projectId: string;
  cardId: string | null;
  initial: AshFields;
}) {
  const [fields, setFields] = useState<AshFields>(initial);
  const [savedCardId, setSavedCardId] = useState(cardId);

  async function save(next: AshFields) {
    const supabase = createClient();
    if (savedCardId) {
      await supabase
        .from("cards")
        .update({ fields: next })
        .eq("id", savedCardId);
    } else {
      const { data } = await supabase
        .from("cards")
        .insert({ project_id: projectId, type: "notes", fields: next })
        .select("id")
        .single();
      if (data) setSavedCardId(data.id);
    }
  }

  function handleNotesBlur() {
    save(fields);
  }

  function updateSource(index: number, value: string) {
    const next = {
      ...fields,
      sources: fields.sources.map((s, i) => (i === index ? value : s)),
    };
    setFields(next);
  }

  function addSource() {
    const next = { ...fields, sources: [...fields.sources, ""] };
    setFields(next);
    save(next);
  }

  function removeSource(index: number) {
    const next = {
      ...fields,
      sources: fields.sources.filter((_, i) => i !== index),
    };
    setFields(next);
    save(next);
  }

  function handleSourceBlur() {
    save(fields);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        gap: "18px",
        alignItems: "start",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "var(--shadow-card)",
        }}
      >
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
          Свободные заметки
        </div>
        <textarea
          value={fields.notes}
          onChange={(e) => setFields({ ...fields, notes: e.target.value })}
          onBlur={handleNotesBlur}
          placeholder="Мысли, правила мира, обрывки диалогов — всё, что не влезло в другие разделы."
          rows={16}
          style={{
            ...editableText,
            fontSize: "15px",
            lineHeight: 1.75,
            color: "#2b2b28",
            width: "100%",
          }}
        />
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            color: "var(--ink-faint)",
            marginBottom: "16px",
          }}
        >
          Источники
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {fields.sources.map((src, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#F0955A",
                  marginTop: "9px",
                  flexShrink: 0,
                }}
              />
              <input
                value={src}
                onChange={(e) => updateSource(i, e.target.value)}
                onBlur={handleSourceBlur}
                placeholder="Ссылка, книга, референс…"
                style={{
                  ...editableText,
                  fontSize: "14px",
                  lineHeight: 1.5,
                  color: "#2b2b28",
                  flex: 1,
                }}
              />
              <button
                onClick={() => removeSource(i)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#C0BCB4",
                  cursor: "pointer",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addSource}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "14px",
            background: "transparent",
            border: "2px dashed var(--border-strong)",
            borderRadius: "10px",
            padding: "9px 12px",
            width: "100%",
            color: "var(--ink-faint)",
            fontWeight: 700,
            fontSize: "12.5px",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          + Добавить источник
        </button>
      </div>
    </div>
  );
}

const editableText: React.CSSProperties = {
  border: "none",
  outline: "none",
  resize: "none",
  background: "transparent",
  fontFamily: "var(--font-sans)",
  padding: 0,
  margin: 0,
};
