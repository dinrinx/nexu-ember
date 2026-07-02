"use client";

// components/modules/QuakeModule.tsx
// Модуль "Катастрофы": три карточки поворотных событий. Автосохранение по blur.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Disaster {
  id: string | null;
  n: number;
  title: string;
  text: string;
}

export function QuakeModule({
  projectId,
  initial,
}: {
  projectId: string;
  initial: Disaster[];
}) {
  const [items, setItems] = useState<Disaster[]>(initial);

  async function save(item: Disaster, index: number) {
    const supabase = createClient();
    if (item.id) {
      await supabase
        .from("cards")
        .update({ fields: { n: item.n, title: item.title, text: item.text } })
        .eq("id", item.id);
    } else {
      const { data } = await supabase
        .from("cards")
        .insert({
          project_id: projectId,
          type: "disaster",
          sort_order: index,
          fields: { n: item.n, title: item.title, text: item.text },
        })
        .select("id")
        .single();
      if (data) {
        const next = [...items];
        next[index] = { ...next[index], id: data.id };
        setItems(next);
      }
    }
  }

  function update(index: number, patch: Partial<Disaster>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    setItems(next);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "18px",
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "26px",
            boxShadow: "var(--shadow-card)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--black)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              fontWeight: 700,
              marginBottom: "18px",
            }}
          >
            {item.n}
          </span>
          <input
            value={item.title}
            onChange={(e) => update(i, { title: e.target.value })}
            onBlur={() => save(items[i], i)}
            placeholder={`Катастрофа ${item.n} — заголовок`}
            style={{
              border: "none",
              outline: "none",
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "-0.2px",
              marginBottom: "10px",
              fontFamily: "var(--font-sans)",
              color: "var(--ink)",
            }}
          />
          <textarea
            value={item.text}
            onChange={(e) => update(i, { text: e.target.value })}
            onBlur={() => save(items[i], i)}
            placeholder="Что происходит и почему пути назад нет?"
            rows={4}
            style={{
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "var(--ink-dim)",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>
      ))}
    </div>
  );
}
