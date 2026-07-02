"use client";

// components/modules/MaterialsModule.tsx
// Чек-лист материалов и техники — страховка от "прихожу, а проектор не
// подключается". Простой список с галочками, сгруппированный на глаз
// пользователем (не жёстко категориями), плюс поле "формат помещения".

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface MaterialItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_ITEMS = [
  "Слайды готовы",
  "Раздатки распечатаны",
  "Ссылки собраны",
  "Проектор",
  "Микрофон",
  "Интернет/Wi-Fi",
];

export function MaterialsModule({
  projectId,
  initialItems,
  initialVenue,
}: {
  projectId: string;
  initialItems: MaterialItem[];
  initialVenue: string;
}) {
  const [items, setItems] = useState<MaterialItem[]>(initialItems);
  const [venue, setVenue] = useState(initialVenue);

  async function addItem(label = "") {
    const supabase = createClient();
    const fields = { label, checked: false };
    const { data } = await supabase
      .from("cards")
      .insert({
        project_id: projectId,
        type: "material",
        fields,
        sort_order: items.length,
      })
      .select("id")
      .single();
    if (data) {
      setItems((prev) => [...prev, { id: data.id, ...fields }]);
    }
  }

  async function seedDefaults() {
    for (const label of DEFAULT_ITEMS) {
      await addItem(label);
    }
  }

  async function toggle(id: string) {
    const supabase = createClient();
    setItems((prev) => {
      const next = prev.map((i) =>
        i.id === id ? { ...i, checked: !i.checked } : i,
      );
      const item = next.find((i) => i.id === id);
      if (item)
        supabase
          .from("cards")
          .update({ fields: { label: item.label, checked: item.checked } })
          .eq("id", id)
          .then();
      return next;
    });
  }

  function updateLabel(id: string, label: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, label } : i)));
  }

  async function persistLabel(id: string) {
    const supabase = createClient();
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item)
        supabase
          .from("cards")
          .update({ fields: { label: item.label, checked: item.checked } })
          .eq("id", id)
          .then();
      return prev;
    });
  }

  async function removeItem(id: string) {
    const supabase = createClient();
    await supabase.from("cards").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function persistVenue(value: string) {
    setVenue(value);
    const supabase = createClient();
    const { data: project } = await supabase
      .from("projects")
      .select("meta")
      .eq("id", projectId)
      .single();
    await supabase
      .from("projects")
      .update({ meta: { ...(project?.meta ?? {}), venue: value } })
      .eq("id", projectId);
  }

  const doneCount = items.filter((i) => i.checked).length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: "18px",
        alignItems: "start",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "26px",
          boxShadow: "var(--shadow-card)",
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
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: "var(--ink-faint)",
            }}
          >
            Материалы и техника — {doneCount} из {items.length}
          </div>
          {items.length === 0 && (
            <button
              onClick={seedDefaults}
              style={{
                background: "transparent",
                border: "1px solid var(--border-strong)",
                borderRadius: "999px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Заполнить типовым списком
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p
            style={{
              fontSize: "14px",
              color: "var(--ink-faint)",
              marginBottom: "16px",
            }}
          >
            Список пуст — добавь пункт руками или возьми типовой набор выше.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginBottom: "14px",
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  padding: "8px 4px",
                }}
              >
                <button
                  onClick={() => toggle(item.id)}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    flexShrink: 0,
                    cursor: "pointer",
                    border: `1.5px solid ${item.checked ? "var(--accent)" : "var(--border-strong)"}`,
                    background: item.checked ? "var(--accent)" : "#fff",
                    color: "#fff",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.checked && "✓"}
                </button>
                <input
                  value={item.label}
                  onChange={(e) => updateLabel(item.id, e.target.value)}
                  onBlur={() => persistLabel(item.id)}
                  placeholder="Пункт списка"
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    flex: 1,
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    color: item.checked ? "var(--ink-faint)" : "var(--ink)",
                    textDecoration: item.checked ? "line-through" : "none",
                  }}
                />
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#C0BCB4",
                    cursor: "pointer",
                    fontSize: "13px",
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => addItem("")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
          + Добавить пункт
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "26px",
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
          Формат помещения
        </div>
        <textarea
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          onBlur={() => persistVenue(venue)}
          placeholder="Сколько человек, расстановка мест, онлайн/офлайн, особенности площадки."
          rows={6}
          style={{
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            width: "100%",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#2b2b28",
            fontFamily: "var(--font-sans)",
          }}
        />
      </div>
    </div>
  );
}
