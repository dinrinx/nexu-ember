"use client";

// components/modules/WriteModule.tsx
// Редактор глав: список слева, справа — панель форматирования + текст.
// Форматирование через нативный document.execCommand (Ж/К/Ч, заголовок/абзац/
// цитата, списки) — без сторонних библиотек, чтобы не тянуть новые зависимости.
// Контент хранится как HTML в таблице blocks (level='chapter').

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
}

export function WriteModule({
  projectId,
  initial,
}: {
  projectId: string;
  initial: Chapter[];
}) {
  const [chapters, setChapters] = useState<Chapter[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const selected = chapters.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (bodyRef.current && selected) {
      bodyRef.current.innerHTML = selected.content || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function addChapter() {
    const supabase = createClient();
    const { data } = await supabase
      .from("blocks")
      .insert({
        project_id: projectId,
        level: "chapter",
        title: "",
        content: "",
        sort_order: chapters.length,
      })
      .select("id")
      .single();
    if (data) {
      const next = { id: data.id, title: "", content: "", wordCount: 0 };
      setChapters((prev) => [...prev, next]);
      setSelectedId(data.id);
    }
  }

  function countWords(html: string) {
    const text = html.replace(/<[^>]+>/g, " ").trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }

  async function saveContent() {
    if (!selected || !bodyRef.current) return;
    const html = bodyRef.current.innerHTML;
    const wordCount = countWords(html);
    const supabase = createClient();
    await supabase
      .from("blocks")
      .update({ content: html, word_count: wordCount })
      .eq("id", selected.id);
    setChapters((prev) =>
      prev.map((c) =>
        c.id === selected.id ? { ...c, content: html, wordCount } : c,
      ),
    );
  }

  async function saveTitle(title: string) {
    if (!selected) return;
    const supabase = createClient();
    await supabase.from("blocks").update({ title }).eq("id", selected.id);
    setChapters((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, title } : c)),
    );
  }

  function exec(command: string, value?: string) {
    bodyRef.current?.focus();
    document.execCommand(command, false, value);
  }

  if (chapters.length === 0) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "230px 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <ChapterList
          chapters={[]}
          selectedId={null}
          onSelect={() => {}}
          onAdd={addChapter}
        />
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
              background: "var(--type-fanfic-bg)",
              margin: "0 auto 20px",
            }}
          />
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>
            Ещё ни одной главы
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
            Создайте первую главу и начните писать прямо здесь — с
            форматированием.
          </p>
          <button
            onClick={addChapter}
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
            + Создать главу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "230px 1fr",
        gap: "20px",
        alignItems: "start",
      }}
    >
      <ChapterList
        chapters={chapters}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={addChapter}
      />

      {selected && (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            boxShadow: "var(--shadow-card)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "10px 14px",
              borderBottom: "1px solid #F0EDE6",
              position: "sticky",
              top: 0,
              background: "#fff",
              zIndex: 2,
              flexWrap: "wrap",
            }}
          >
            <ToolBtn onClick={() => exec("bold")} bold>
              Ж
            </ToolBtn>
            <ToolBtn onClick={() => exec("italic")} italic>
              К
            </ToolBtn>
            <ToolBtn onClick={() => exec("underline")} underline>
              Ч
            </ToolBtn>
            <Divider />
            <ToolBtn onClick={() => exec("formatBlock", "H2")} wide>
              Заголовок
            </ToolBtn>
            <ToolBtn onClick={() => exec("formatBlock", "P")} wide>
              Абзац
            </ToolBtn>
            <ToolBtn onClick={() => exec("formatBlock", "BLOCKQUOTE")} wide>
              Цитата
            </ToolBtn>
            <Divider />
            <ToolBtn onClick={() => exec("insertUnorderedList")}>•</ToolBtn>
            <ToolBtn onClick={() => exec("insertOrderedList")} wide>
              1.
            </ToolBtn>
            <span style={{ flex: 1 }} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--ink-faint)",
                whiteSpace: "nowrap",
              }}
            >
              Слов: {countWords(selected.content)}
            </span>
          </div>

          <div
            style={{
              padding: "36px 44px 60px",
              maxHeight: "640px",
              overflow: "auto",
            }}
          >
            <div
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Название главы"
              onBlur={(e) => saveTitle(e.currentTarget.textContent ?? "")}
              style={{
                maxWidth: "700px",
                margin: "0 auto 8px",
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                outline: "none",
                borderRadius: "10px",
                padding: "4px 6px",
              }}
            >
              {selected.title}
            </div>
            <div
              style={{
                maxWidth: "700px",
                margin: "0 auto 24px",
                height: "1px",
                background: "#F0EDE6",
              }}
            />
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={saveContent}
              style={{
                maxWidth: "700px",
                margin: "0 auto",
                fontSize: "16px",
                lineHeight: 1.8,
                color: "var(--ink)",
                outline: "none",
                minHeight: "300px",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ChapterList({
  chapters,
  selectedId,
  onSelect,
  onAdd,
}: {
  chapters: Chapter[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "var(--ink-faint)",
          padding: "0 4px 6px",
        }}
      >
        Главы
      </div>
      {chapters.map((c, i) => {
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              textAlign: "left",
              background: active ? "var(--black)" : "#fff",
              color: active ? "#fff" : "var(--ink)",
              border: `1px solid ${active ? "var(--black)" : "var(--border)"}`,
              borderRadius: "12px",
              padding: "11px 14px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {c.title || `Глава ${i + 1}`}
          </button>
        );
      })}
      <button
        onClick={onAdd}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          background: "transparent",
          border: "2px dashed var(--border-strong)",
          borderRadius: "12px",
          padding: "11px 14px",
          cursor: "pointer",
          color: "var(--ink-faint)",
          fontWeight: 700,
          fontSize: "13px",
          marginTop: "4px",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span style={{ fontSize: "15px" }}>+</span>Новая глава
      </button>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  bold,
  italic,
  underline,
  wide,
}: {
  children: React.ReactNode;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      style={{
        height: "34px",
        padding: wide ? "0 12px" : 0,
        width: wide ? "auto" : "34px",
        border: "none",
        background: "transparent",
        borderRadius: "9px",
        cursor: "pointer",
        fontSize: wide ? "13px" : "15px",
        fontWeight: bold || wide ? 700 : 400,
        fontStyle: italic ? "italic" : "normal",
        textDecoration: underline ? "underline" : "none",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <span
      style={{
        width: "1px",
        height: "20px",
        background: "#E7E3DA",
        margin: "0 6px",
      }}
    />
  );
}
