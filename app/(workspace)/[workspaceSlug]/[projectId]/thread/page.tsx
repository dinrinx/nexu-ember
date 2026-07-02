// app/(workspace)/[workspaceSlug]/[projectId]/thread/page.tsx

import { createClient } from "@/lib/supabase/server";
import { ThreadModule } from "@/components/modules/ThreadModule";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("type, meta")
    .eq("id", projectId)
    .single();

  const { data: events } = await supabase
    .from("timeline_events")
    .select("id, title, description, type, duration_min")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  return (
    <ThreadModule
      projectId={projectId}
      projectType={project?.type ?? "fanfic"}
      initialTotalMinutes={project?.meta?.totalMinutes ?? 0}
      initial={(events ?? []).map((e) => ({
        id: e.id,
        title: e.title ?? "",
        description: e.description ?? "",
        type: (e.type ?? "plot") as any,
        durationMin: e.duration_min ?? 5,
      }))}
    />
  );
}
