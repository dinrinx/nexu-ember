"use client";

// components/modules/QAModule.tsx
// Банк вопросов от аудитории и заготовленных ответов — страховка от ступора
// на сложном вопросе. Можно пометить вопрос как частый.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface QAItem {
  id: string;
  question: string;
  answer: string;
  frequent: boolean;
}

export function QAModule({
  projectId,
  initial,
}: {
  projectId: string;
  initial: QAItem[];
}) {
  const [items, setItems] = useState<QAItem[]>(initial);

  async function addItem() {
    const supabase = createClient();
    const fields = { question: "", answer: "", frequent: false };
    const { data } = await supabase
      .from("cards")
      .insert({
        project_id: projectId,
        type: "qa",
        fields,
        sort_order: items.length,
      })
      .select("id")
      .single();
    if (data) {
      setItems((prev) => [...prev, { id: data.id, ...fields }]);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("Удалить этот вопрос?")) return;
    const supabase = createClient();
    await supabase.from("cards").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function patch(id: string, patch: Partial<QAItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function persist(id: string) {
    const supabase = createClient();
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        supabase
          .from("cards")
          .update({
            fields: {
              question: item.question,
              answer: item.answer,
              frequent: item.frequent,
            },
          })
          .eq("id", id)
          .then();
      }
      return prev;
    });
  }

  async function toggleFrequent(id: string) {
    const supabase = createClient();
    setItems((prev) => {
      const next = prev.map((i) =>
        i.id === id ? { ...i, frequent: !i.frequent } : i,
      );
      const item = next.find((i) => i.id === id);
      if (item)
        supabase
          .from("cards")
          .update({
            fields: {
              question: item.question,
              answer: item.answer,
              frequent: item.frequent,
            },
          })
          .eq("id", id)
          .then();
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px dashed var(--border-strong)",
          borderRadius: "20px",
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "var(--type-talk-bg)",
            margin: "0 auto 20px",
          }}
        />
        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>
          Вопросов пока нет
        </h3>
        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--ink-dim)",
            margin: "0 auto 22px",
            maxWidth: "380px",
          }}
        >
          Продумайте заранее сложные вопросы от аудитории и заготовьте ответы —
          это спасает от ступора на сцене.
        </p>
        <button
          onClick={addItem}
          style={{
            background: "var(--black)",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "12px 22px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          + Добавить вопрос
        </button>
      </div>
    );
  }

  const sorted = [...items].sort(
    (a, b) => Number(b.frequent) - Number(a.frequent),
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={addItem}
          style={{
            background: "var(--black)",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          + Добавить вопрос
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sorted.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "18px 20px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "10px",
              }}
            >
              <button
                onClick={() => toggleFrequent(item.id)}
                title={item.frequent ? "Частый вопрос" : "Отметить как частый"}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "17px",
                  color: item.frequent ? "var(--accent)" : "#D9D5CB",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                {item.frequent ? "★" : "☆"}
              </button>
              <input
                value={item.question}
                onChange={(e) => patch(item.id, { question: e.target.value })}
                onBlur={() => persist(item.id)}
                placeholder="Какой вопрос могут задать?"
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "15px",
                  fontWeight: 700,
                  letterSpacing: "-0.1px",
                  flex: 1,
                  fontFamily: "var(--font-sans)",
                  color: "var(--ink)",
                }}
              />
              <button
                onClick={() => removeItem(item.id)}
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
            <textarea
              value={item.answer}
              onChange={(e) => patch(item.id, { answer: e.target.value })}
              onBlur={() => persist(item.id)}
              placeholder="Заготовленный ответ"
              rows={2}
              style={{
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: "14px",
                lineHeight: 1.55,
                color: "var(--ink-dim)",
                width: "100%",
                paddingLeft: "29px",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
