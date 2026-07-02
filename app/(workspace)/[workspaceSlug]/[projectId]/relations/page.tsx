// app/(workspace)/[workspaceSlug]/[projectId]/relations/page.tsx

import { createClient } from "@/lib/supabase/server";
import { RelationsModule } from "@/components/modules/RelationsModule";

export default async function RelationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, type, fields")
    .eq("project_id", projectId)
    .in("type", ["character", "event"]);

  const nodes = (cards ?? []).map((c) => ({
    id: c.id,
    kind: c.type as "character" | "event",
    label:
      c.type === "character" ? (c.fields?.name ?? "") : (c.fields?.title ?? ""),
    x: c.fields?.graphX ?? 60,
    y: c.fields?.graphY ?? 60,
  }));

  const cardIds = nodes.map((n) => n.id);

  const { data: linkRows } = cardIds.length
    ? await supabase
        .from("card_links")
        .select("id, card_id_a, card_id_b, relation_type, note")
        .in("card_id_a", cardIds)
    : { data: [] };

  const links = (linkRows ?? []).map((l) => ({
    id: l.id,
    aId: l.card_id_a,
    bId: l.card_id_b,
    relationType: l.relation_type ?? "",
    note: l.note ?? "",
  }));

  return (
    <RelationsModule
      projectId={projectId}
      initialNodes={nodes}
      initialLinks={links}
    />
  );
}
