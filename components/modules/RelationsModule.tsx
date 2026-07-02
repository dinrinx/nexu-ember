"use client";

// components/modules/RelationsModule.tsx
// Карта связей: перетаскиваемые узлы (герои — сиреневые, события — голубые),
// линии связей между ними. Клик по значку 🔗 на узле — начать связь,
// клик по другому узлу — завершить. Клик по подписи на линии — описать
// отношения (кто они друг другу, как относятся).

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface GraphNode {
  id: string;
  kind: "character" | "event";
  label: string;
  x: number;
  y: number;
}

interface GraphLink {
  id: string;
  aId: string;
  bId: string;
  relationType: string;
  note: string;
}

const NODE_WIDTH = 160;

export function RelationsModule({
  projectId,
  initialNodes,
  initialLinks,
}: {
  projectId: string;
  initialNodes: GraphNode[];
  initialLinks: GraphLink[];
}) {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [links, setLinks] = useState<GraphLink[]>(initialLinks);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const dragState = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function addNode(kind: "character" | "event") {
    const supabase = createClient();
    const x = 60 + Math.random() * 300;
    const y = 40 + Math.random() * 300;
    const label = kind === "character" ? "" : "";
    const type = kind === "character" ? "character" : "event";
    const fields =
      kind === "character"
        ? {
            name: "",
            role: "",
            desc: "",
            goal: "",
            motivation: "",
            conflict: "",
            arc: "",
            graphX: x,
            graphY: y,
          }
        : { title: "", graphX: x, graphY: y };

    const { data } = await supabase
      .from("cards")
      .insert({ project_id: projectId, type, fields })
      .select("id")
      .single();

    if (data) {
      setNodes((prev) => [...prev, { id: data.id, kind, label, x, y }]);
    }
  }

  function handleMouseDown(e: React.MouseEvent, node: GraphNode) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragState.current = {
      id: node.id,
      offsetX: e.clientX - rect.left - node.x,
      offsetY: e.clientY - rect.top - node.y,
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragState.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { id, offsetX, offsetY } = dragState.current;
    const x = Math.max(0, e.clientX - rect.left - offsetX);
    const y = Math.max(0, e.clientY - rect.top - offsetY);
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  }

  async function persistPosition(id: string) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const supabase = createClient();
    const { data: card } = await supabase
      .from("cards")
      .select("fields")
      .eq("id", id)
      .single();
    await supabase
      .from("cards")
      .update({
        fields: { ...(card?.fields ?? {}), graphX: node.x, graphY: node.y },
      })
      .eq("id", id);
  }

  function endDrag() {
    if (dragState.current) {
      const id = dragState.current.id;
      dragState.current = null;
      persistPosition(id);
    }
  }

  async function handleNodeClick(node: GraphNode) {
    if (!connectFrom) return;
    if (connectFrom === node.id) {
      setConnectFrom(null);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("card_links")
      .insert({
        card_id_a: connectFrom,
        card_id_b: node.id,
        relation_type: "",
        note: "",
      })
      .select("id")
      .single();
    if (data) {
      setLinks((prev) => [
        ...prev,
        {
          id: data.id,
          aId: connectFrom,
          bId: node.id,
          relationType: "",
          note: "",
        },
      ]);
    }
    setConnectFrom(null);
  }

  async function editLink(link: GraphLink) {
    const type = window.prompt(
      "Кто они друг другу? (например: враги, возлюбленные, наставник)",
      link.relationType,
    );
    if (type === null) return;
    const note =
      window.prompt(
        "Как они относятся друг к другу? (свободное описание)",
        link.note,
      ) ?? link.note;
    const supabase = createClient();
    await supabase
      .from("card_links")
      .update({ relation_type: type, note })
      .eq("id", link.id);
    setLinks((prev) =>
      prev.map((l) =>
        l.id === link.id ? { ...l, relationType: type, note } : l,
      ),
    );
  }

  async function removeLink(link: GraphLink, e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Удалить эту связь?")) return;
    const supabase = createClient();
    await supabase.from("card_links").delete().eq("id", link.id);
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
  }

  function nodeCenter(id: string) {
    const n = nodes.find((x) => x.id === id);
    if (!n) return { x: 0, y: 0 };
    return { x: n.x + NODE_WIDTH / 2, y: n.y + 28 };
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
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              color: "var(--ink-faint)",
              marginBottom: "4px",
            }}
          >
            Карта связей
          </div>
          <p style={{ fontSize: "13px", color: "var(--ink-dim)", margin: 0 }}>
            Перетаскивайте узлы.{" "}
            <span style={{ color: "var(--type-book-dot)", fontWeight: 700 }}>
              Сиреневые
            </span>{" "}
            — герои,{" "}
            <span style={{ color: "var(--type-talk-dot)", fontWeight: 700 }}>
              голубые
            </span>{" "}
            — события. Кликните 🔗 на узле, затем на другой узел — чтобы
            связать. Клик по подписи на линии — описать отношения.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => addNode("character")} style={pillBtn}>
            + Герой
          </button>
          <button onClick={() => addNode("event")} style={pillBtn}>
            + Событие
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        style={{
          position: "relative",
          height: "560px",
          background: "#fff",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
          backgroundImage: "radial-gradient(#EDEAE2 1.4px, transparent 1.4px)",
          backgroundSize: "26px 26px",
        }}
      >
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {links.map((l) => {
            const a = nodeCenter(l.aId);
            const b = nodeCenter(l.bId);
            return (
              <line
                key={l.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#D8D3C8"
                strokeWidth={2}
              />
            );
          })}
        </svg>

        {links.map((l) => {
          const a = nodeCenter(l.aId);
          const b = nodeCenter(l.bId);
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          return (
            <button
              key={l.id}
              onClick={() => editLink(l)}
              onContextMenu={(e) => removeLink(l, e)}
              title="Клик — описать, правая кнопка — удалить"
              style={{
                position: "absolute",
                left: midX,
                top: midY,
                transform: "translate(-50%, -50%)",
                background: l.relationType ? "#fff" : "#F5F2EA",
                border: "1px solid var(--border)",
                borderRadius: "999px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: 700,
                color: l.relationType ? "var(--ink)" : "var(--ink-faint)",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {l.relationType || "+ описать"}
            </button>
          );
        })}

        {nodes.map((n) => {
          const accent =
            n.kind === "character"
              ? "var(--type-book-dot)"
              : "var(--type-talk-dot)";
          const connecting = connectFrom === n.id;
          return (
            <div
              key={n.id}
              onMouseDown={(e) => handleMouseDown(e, n)}
              onClick={() => handleNodeClick(n)}
              style={{
                position: "absolute",
                left: n.x,
                top: n.y,
                width: `${NODE_WIDTH}px`,
                cursor: "grab",
                userSelect: "none",
                background: "#fff",
                border: `1px solid ${connecting ? accent : "var(--border)"}`,
                borderLeft: `4px solid ${accent}`,
                borderRadius: "14px",
                padding: "12px 14px",
                boxShadow: connecting
                  ? `0 0 0 3px ${accent}33, 0 6px 18px rgba(20,20,20,0.08)`
                  : "0 6px 18px rgba(20,20,20,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    color: accent,
                  }}
                >
                  {n.kind === "character" ? "Персонаж" : "Событие"}
                </span>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConnectFrom(connecting ? null : n.id);
                  }}
                  title="Связать с другим узлом"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  🔗
                </button>
              </div>
              <NodeLabelEditor
                node={n}
                setNodes={setNodes}
                projectId={projectId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NodeLabelEditor({
  node,
  setNodes,
  projectId,
}: {
  node: GraphNode;
  setNodes: React.Dispatch<React.SetStateAction<GraphNode[]>>;
  projectId: string;
}) {
  const [value, setValue] = useState(node.label);

  async function persist() {
    setNodes((prev) =>
      prev.map((n) => (n.id === node.id ? { ...n, label: value } : n)),
    );
    const supabase = createClient();
    const { data: card } = await supabase
      .from("cards")
      .select("fields, type")
      .eq("id", node.id)
      .single();
    if (!card) return;
    const key = card.type === "character" ? "name" : "title";
    await supabase
      .from("cards")
      .update({ fields: { ...card.fields, [key]: value } })
      .eq("id", node.id);
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={persist}
      onMouseDown={(e) => e.stopPropagation()}
      placeholder={node.kind === "character" ? "Имя героя" : "Название события"}
      style={{
        border: "none",
        outline: "none",
        background: "transparent",
        fontSize: "14px",
        fontWeight: 700,
        letterSpacing: "-0.2px",
        lineHeight: 1.25,
        width: "100%",
        fontFamily: "var(--font-sans)",
        color: "var(--ink)",
      }}
    />
  );
}

const pillBtn: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--border-strong)",
  borderRadius: "999px",
  padding: "10px 16px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};
