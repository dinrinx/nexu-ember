"use client";

// components/modules/ScrollModule.tsx
// Модуль "Синопсис": краткий синопсис в мятной карточке (sticky) + полный
// синопсис в белой карточке. Автосохранение по blur.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ScrollFields {
  short: string;
  full: string;
}

export function ScrollModule({
  projectId,
  cardId,
  initial,
}: {
  projectId: string;
  cardId: string | null;
  initial: ScrollFields;
}) {
  const [fields, setFields] = useState<ScrollFields>(initial);
  const [savedCardId, setSavedCardId] = useState(cardId);

  async function save(next: ScrollFields) {
    const supabase = createClient();
    if (savedCardId) {
      await supabase
        .from("cards")
        .update({ fields: next })
        .eq("id", savedCardId);
    } else {
      const { data } = await supabase
        .from("cards")
        .insert({ project_id: projectId, type: "synopsis", fields: next })
        .select("id")
        .single();
      if (data) setSavedCardId(data.id);
    }
  }

  function handleBlur() {
    save(fields);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.5fr",
        gap: "18px",
        alignItems: "start",
      }}
    >
      <div
        style={{
          background: "var(--status-done-bg)",
          borderRadius: "20px",
          padding: "28px",
          position: "sticky",
          top: "20px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            color: "var(--status-done-fg)",
            marginBottom: "14px",
          }}
        >
          Краткий синопсис
        </div>
        <textarea
          value={fields.short}
          onChange={(e) => setFields({ ...fields, short: e.target.value })}
          onBlur={handleBlur}
          placeholder="Сожмите всю историю в один абзац — от начала до финала."
          rows={8}
          style={{
            ...editableText,
            fontSize: "16px",
            lineHeight: 1.65,
            fontWeight: 500,
            color: "#12452F",
            width: "100%",
          }}
        />
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "30px",
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
          Полный синопсис
        </div>
        <textarea
          value={fields.full}
          onChange={(e) => setFields({ ...fields, full: e.target.value })}
          onBlur={handleBlur}
          placeholder="Разверните краткий синопсис в подробный пересказ по актам или главам."
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
