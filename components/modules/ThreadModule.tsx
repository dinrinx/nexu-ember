"use client";

// components/modules/ThreadModule.tsx
// Для художки — события на шкале с типом и описанием (как раньше).
// Для выступлений — то же самое, но с длительностью каждого блока в минутах
// и общим хронометражем: сколько уже расписано из отведённого времени.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FictionType = "plot" | "character" | "milestone" | "research";
type TalkType = "hook" | "main" | "break" | "qna" | "buffer";
type EventType = FictionType | TalkType;

const FICTION_CYCLE: FictionType[] = [
  "plot",
  "character",
  "milestone",
  "research",
];
const TALK_CYCLE: TalkType[] = ["hook", "main", "break", "qna", "buffer"];

const TYPE_META: Record<
  EventType,
  { label: string; bg: string; fg: string; dot: string }
> = {
  plot: {
    label: "Сюжет",
    bg: "var(--type-fanfic-bg)",
    fg: "var(--type-fanfic-fg)",
    dot: "var(--type-fanfic-dot)",
  },
  character: {
    label: "Герой",
    bg: "var(--type-book-bg)",
    fg: "var(--type-book-fg)",
    dot: "var(--type-book-dot)",
  },
  milestone: {
    label: "Веха",
    bg: "var(--type-talk-bg)",
    fg: "var(--type-talk-fg)",
    dot: "var(--type-talk-dot)",
  },
  research: {
    label: "Ресёрч",
    bg: "var(--status-progress-bg)",
    fg: "var(--status-progress-fg)",
    dot: "#8FA83A",
  },
  hook: {
    label: "Хук",
    bg: "var(--type-fanfic-bg)",
    fg: "var(--type-fanfic-fg)",
    dot: "var(--type-fanfic-dot)",
  },
  main: {
    label: "Основная часть",
    bg: "var(--type-book-bg)",
    fg: "var(--type-book-fg)",
    dot: "var(--type-book-dot)",
  },
  break: { label: "Перерыв", bg: "#EEEBE4", fg: "#8A8A85", dot: "#C0BCB4" },
  qna: {
    label: "Q&A",
    bg: "var(--type-talk-bg)",
    fg: "var(--type-talk-fg)",
    dot: "var(--type-talk-dot)",
  },
  buffer: {
    label: "Буфер",
    bg: "var(--status-draft-bg)",
    fg: "var(--status-draft-fg)",
    dot: "#D98CAE",
  },
};

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  durationMin: number;
}

export function ThreadModule({
  projectId,
  projectType,
  initial,
  initialTotalMinutes,
}: {
  projectId: string;
  projectType: string;
  initial: TimelineEvent[];
  initialTotalMinutes: number;
}) {
  const isTalk = projectType === "talk";
  const CYCLE = (isTalk ? TALK_CYCLE : FICTION_CYCLE) as EventType[];
  const defaultType: EventType = isTalk ? "main" : "plot";

  const [events, setEvents] = useState<TimelineEvent[]>(initial);
  const [zoom, setZoom] = useState(100);
  const [totalMinutes, setTotalMinutes] = useState(initialTotalMinutes);

  const usedMinutes = events.reduce(
    (sum, e) => sum + (isTalk ? e.durationMin : 0),
    0,
  );
  const overBudget = isTalk && totalMinutes > 0 && usedMinutes > totalMinutes;

  async function addEvent() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("timeline_events")
      .insert({
        project_id: projectId,
        title: "",
        description: "",
        type: defaultType,
        duration_min: 5,
        sort_order: events.length,
      })
      .select("id")
      .single();
    if (error) {
      alert("Не получилось создать событие: " + error.message);
      return;
    }
    if (data) {
      setEvents((prev) => [
        ...prev,
        {
          id: data.id,
          title: "",
          description: "",
          type: defaultType,
          durationMin: 5,
        },
      ]);
    }
  }

  async function removeEvent(id: string) {
    const supabase = createClient();
    await supabase.from("timeline_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function patch(id: string, patch: Partial<TimelineEvent>) {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  }

  async function persist(id: string) {
    const supabase = createClient();
    setEvents((prev) => {
      const e = prev.find((x) => x.id === id);
      if (e)
        supabase
          .from("timeline_events")
          .update({ title: e.title, description: e.description })
          .eq("id", id)
          .then();
      return prev;
    });
  }

  async function persistDuration(id: string, minutes: number) {
    const supabase = createClient();
    await supabase
      .from("timeline_events")
      .update({ duration_min: minutes })
      .eq("id", id);
  }

  async function cycleType(id: string) {
    const supabase = createClient();
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const nextType = CYCLE[(CYCLE.indexOf(e.type) + 1) % CYCLE.length];
        supabase
          .from("timeline_events")
          .update({ type: nextType })
          .eq("id", id)
          .then();
        return { ...e, type: nextType };
      }),
    );
  }

  async function persistTotalMinutes(value: number) {
    setTotalMinutes(value);
    const supabase = createClient();
    const { data: project } = await supabase
      .from("projects")
      .select("meta")
      .eq("id", projectId)
      .single();
    await supabase
      .from("projects")
      .update({ meta: { ...(project?.meta ?? {}), totalMinutes: value } })
      .eq("id", projectId);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "2px",
            background: "#EFECE6",
            borderRadius: "12px",
            padding: "4px",
          }}
        >
          <button
            onClick={() => setZoom((z) => Math.max(60, z - 20))}
            style={zoomBtn}
          >
            −
          </button>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--ink-dim)",
              padding: "0 12px",
              minWidth: "70px",
              textAlign: "center",
            }}
          >
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(160, z + 20))}
            style={zoomBtn}
          >
            +
          </button>
        </div>
        <button
          onClick={addEvent}
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
          + Добавить событие
        </button>
      </div>

      {isTalk && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
            background: overBudget ? "#FFF0F5" : "#fff",
            border: `1px solid ${overBudget ? "#F0B8CE" : "var(--border)"}`,
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "18px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "var(--ink-faint)",
                marginBottom: "4px",
              }}
            >
              Хронометраж
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: overBudget ? "var(--status-draft-fg)" : "var(--ink)",
              }}
            >
              {usedMinutes} из {totalMinutes || "—"} мин
              {overBudget && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginLeft: "10px",
                  }}
                >
                  превышение на {usedMinutes - totalMinutes} мин
                </span>
              )}
            </div>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "var(--ink-dim)",
            }}
          >
            Всего минут на выступление:
            <input
              type="number"
              min={0}
              value={totalMinutes || ""}
              onChange={(e) => persistTotalMinutes(Number(e.target.value) || 0)}
              style={{
                width: "70px",
                border: "1px solid var(--border-strong)",
                borderRadius: "8px",
                padding: "6px 8px",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
              }}
            />
          </label>
        </div>
      )}

      {events.length === 0 ? (
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
            {isTalk ? "Раскадровка пуста" : "Таймлайн пуст"}
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
            {isTalk
              ? "Распишите выступление по блокам: хук, основная часть, перерывы, Q&A."
              : "Расставьте ключевые события на шкале — по главам или актам."}
          </p>
          <button
            onClick={addEvent}
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
            + Добавить событие
          </button>
        </div>
      ) : (
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top left",
            width: `${10000 / zoom}%`,
          }}
        >
          <div style={{ position: "relative", paddingLeft: "8px" }}>
            <div
              style={{
                position: "absolute",
                left: "34px",
                top: "10px",
                bottom: "10px",
                width: "2px",
                background: "#E7E3DA",
              }}
            />
            {events.map((e) => {
              const meta = TYPE_META[e.type];
              return (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    gap: "20px",
                    marginBottom: "14px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      flex: "none",
                      display: "flex",
                      justifyContent: "center",
                      paddingTop: "22px",
                      position: "relative",
                      zIndex: 1,
                      marginLeft: "18px",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: meta.dot,
                        border: "3px solid var(--bg-page)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: "#fff",
                      border: "1px solid var(--border)",
                      borderRadius: "16px",
                      padding: "16px 20px",
                      boxShadow: "0 6px 18px rgba(20,20,20,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "14px",
                        marginBottom: "6px",
                      }}
                    >
                      <input
                        value={e.title}
                        onChange={(ev) =>
                          patch(e.id, { title: ev.target.value })
                        }
                        onBlur={() => persist(e.id)}
                        placeholder="Название события"
                        style={{
                          border: "none",
                          outline: "none",
                          fontSize: "16px",
                          fontWeight: 700,
                          letterSpacing: "-0.2px",
                          fontFamily: "var(--font-sans)",
                          color: "var(--ink)",
                          flex: 1,
                          background: "transparent",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flex: "none",
                        }}
                      >
                        {isTalk && (
                          <input
                            type="number"
                            min={0}
                            value={e.durationMin}
                            onChange={(ev) =>
                              patch(e.id, {
                                durationMin: Number(ev.target.value) || 0,
                              })
                            }
                            onBlur={() => persistDuration(e.id, e.durationMin)}
                            title="Длительность, мин"
                            style={{
                              width: "52px",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              padding: "4px 6px",
                              fontSize: "12px",
                              fontFamily: "var(--font-sans)",
                              textAlign: "center",
                            }}
                          />
                        )}
                        <button
                          onClick={() => cycleType(e.id)}
                          title="Сменить тип"
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "4px 11px",
                            borderRadius: "999px",
                            background: meta.bg,
                            color: meta.fg,
                            border: "none",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {meta.label} ⟳
                        </button>
                        <button
                          onClick={() => removeEvent(e.id)}
                          title="Удалить"
                          style={{
                            width: "26px",
                            height: "26px",
                            border: "none",
                            background: "transparent",
                            color: "#C0BCB4",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "15px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={e.description}
                      onChange={(ev) =>
                        patch(e.id, { description: ev.target.value })
                      }
                      onBlur={() => persist(e.id)}
                      placeholder="Описание"
                      rows={2}
                      style={{
                        border: "none",
                        outline: "none",
                        resize: "none",
                        fontSize: "14px",
                        lineHeight: 1.55,
                        color: "var(--ink-dim)",
                        fontFamily: "var(--font-sans)",
                        width: "100%",
                        background: "transparent",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const zoomBtn: React.CSSProperties = {
  width: "32px",
  height: "32px",
  border: "none",
  background: "#fff",
  borderRadius: "9px",
  fontSize: "18px",
  fontWeight: 700,
  cursor: "pointer",
  color: "var(--ink)",
  boxShadow: "0 1px 3px rgba(20,20,20,.08)",
};
