// app/(workspace)/[workspaceSlug]/[projectId]/cast/page.tsx

import { createClient } from "@/lib/supabase/server";
import {
  CastModule,
  emptyCharacterFields,
} from "@/components/modules/CastModule";

const AVATAR_COLORS = [
  "var(--type-book-bg)",
  "var(--type-fanfic-bg)",
  "var(--type-talk-bg)",
  "var(--status-progress-bg)",
  "var(--status-draft-bg)",
  "var(--status-done-bg)",
];

export default async function CastPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", projectId)
    .single();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, fields")
    .eq("project_id", projectId)
    .eq("type", "character")
    .order("sort_order", { ascending: true });

  const characters = (cards ?? []).map((c, i) => ({
    id: c.id,
    fields: { ...emptyCharacterFields(), ...c.fields },
    avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));

  return (
    <CastModule
      workspaceId={project?.workspace_id ?? ""}
      projectId={projectId}
      initial={characters}
    />
  );
}
