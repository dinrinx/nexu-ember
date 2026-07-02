"use client";

// components/modules/SparkModule.tsx
// Для художки — логлайн, абзац-развёртка, тема (как раньше).
// Для выступлений — дополнительно учебные результаты по уровням
// таксономии Блума и точка входа (что аудитория уже должна знать).

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface BloomFields {
  remember: string;
  understand: string;
  apply: string;
  analyze: string;
}

interface SparkFields {
  logline: string;
  expand: string;
  theme: string;
  bloom: BloomFields;
  entryPoint: string;
}

const emptyBloom: BloomFields = {
  remember: "",
  understand: "",
  apply: "",
  analyze: "",
};

export function SparkModule({
  projectId,
  projectType,
  cardId,
  initial,
}: {
  projectId: string;
  projectType: string;
  cardId: string | null;
  initial: SparkFields;
}) {
  const isTalk = projectType === "talk";
  const [fields, setFields] = useState<SparkFields>(initial);
  const [savedCardId, setSavedCardId] = useState(cardId);
  const [saving, setSaving] = useState(false);

  async function save(next: SparkFields) {
    setSaving(true);
    const supabase = createClient();
    if (savedCardId) {
      await supabase
        .from("cards")
        .update({ fields: next })
        .eq("id", savedCardId);
    } else {
      const { data } = await supabase
        .from("cards")
        .insert({ project_id: projectId, type: "concept", fields: next })
        .select("id")
        .single();
      if (data) setSavedCardId(data.id);
    }
    setSaving(false);
  }

  function handleBlur() {
    save(fields);
  }

  function updateBloom(key: keyof BloomFields, value: string) {
    setFields({ ...fields, bloom: { ...fields.bloom, [key]: value } });
  }

  return (
    <div>
      <div
        style={{
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "var(--shadow-card)",
          marginBottom: "18px",
        }}
      >
        <div style={cardLabel}>
          {isTalk
            ? "Ключевое сообщение — одна мысль"
            : "Логлайн — одно предложение"}
        </div>
        <textarea
          value={fields.logline}
          onChange={(e) => setFields({ ...fields, logline: e.target.value })}
          onBlur={handleBlur}
          placeholder={
            isTalk
              ? "Главная мысль, которую должна унести аудитория."
              : "Например: после гибели друга подросток из банды пытается изменить прошлое."
          }
          rows={2}
          style={{
            ...editableText,
            fontSize: "22px",
            fontWeight: 600,
            letterSpacing: "-0.3px",
            width: "100%",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: "18px",
          marginBottom: isTalk ? "18px" : 0,
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
          <div style={cardLabel}>
            {isTalk ? "Развёртка выступления" : "Абзац-развёртка"}
          </div>
          <textarea
            value={fields.expand}
            onChange={(e) => setFields({ ...fields, expand: e.target.value })}
            onBlur={handleBlur}
            placeholder={
              isTalk
                ? "О чём выступление от начала до конца, в 4-5 предложений."
                : "Разверните логлайн: завязка → три катастрофы → финал."
            }
            rows={6}
            style={{
              ...editableText,
              fontSize: "15px",
              lineHeight: 1.7,
              color: "#2b2b28",
              width: "100%",
            }}
          />
        </div>
        <div
          style={{
            background: "var(--type-book-bg)",
            borderRadius: "20px",
            padding: "26px",
            color: "#3B3183",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: "#5A4FB0",
              marginBottom: "14px",
            }}
          >
            {isTalk ? "Зачем это аудитории" : "Тема"}
          </div>
          <textarea
            value={fields.theme}
            onChange={(e) => setFields({ ...fields, theme: e.target.value })}
            onBlur={handleBlur}
            placeholder={
              isTalk
                ? "Почему аудитории это важно?"
                : "О чём это на самом деле?"
            }
            rows={5}
            style={{
              ...editableText,
              fontSize: "17px",
              lineHeight: 1.55,
              fontWeight: 600,
              color: "#3B3183",
              width: "100%",
            }}
          />
        </div>
      </div>

      {isTalk && (
        <>
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "26px",
              boxShadow: "var(--shadow-card)",
              marginBottom: "18px",
            }}
          >
            <div style={cardLabel}>
              Учебные результаты — что аудитория сможет после
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <BloomField
                label="Запомнить"
                value={fields.bloom.remember}
                onChange={(v) => updateBloom("remember", v)}
                onBlur={handleBlur}
                placeholder="Какие факты/термины должны отложиться?"
              />
              <BloomField
                label="Понять"
                value={fields.bloom.understand}
                onChange={(v) => updateBloom("understand", v)}
                onBlur={handleBlur}
                placeholder="Что должны объяснить своими словами?"
              />
              <BloomField
                label="Применить"
                value={fields.bloom.apply}
                onChange={(v) => updateBloom("apply", v)}
                onBlur={handleBlur}
                placeholder="Что смогут сделать на практике?"
              />
              <BloomField
                label="Проанализировать"
                value={fields.bloom.analyze}
                onChange={(v) => updateBloom("analyze", v)}
                onBlur={handleBlur}
                placeholder="Какие связи/выводы смогут построить сами?"
              />
            </div>
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
            <div style={cardLabel}>Точка входа</div>
            <textarea
              value={fields.entryPoint}
              onChange={(e) =>
                setFields({ ...fields, entryPoint: e.target.value })
              }
              onBlur={handleBlur}
              placeholder="Что аудитория уже должна знать/уметь до начала — чтобы не потерять слишком простым или слишком сложным стартом."
              rows={3}
              style={{
                ...editableText,
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#2b2b28",
                width: "100%",
              }}
            />
          </div>
        </>
      )}

      {saving && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--ink-faint)",
            marginTop: "10px",
          }}
        >
          Сохраняю…
        </p>
      )}
    </div>
  );
}

function BloomField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          color: "var(--ink-faint)",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={2}
        style={{
          ...editableText,
          fontSize: "13.5px",
          lineHeight: 1.5,
          width: "100%",
        }}
      />
    </div>
  );
}

const cardLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  color: "var(--ink-faint)",
  marginBottom: "14px",
};

const editableText: React.CSSProperties = {
  border: "none",
  outline: "none",
  resize: "none",
  background: "transparent",
  fontFamily: "var(--font-sans)",
  padding: 0,
  margin: 0,
};
