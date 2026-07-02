// app/(workspace)/[workspaceSlug]/[projectId]/materials/page.tsx

import { createClient } from "@/lib/supabase/server";
import { MaterialsModule } from "@/components/modules/MaterialsModule";

export default async function MaterialsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("meta")
    .eq("id", projectId)
    .single();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, fields")
    .eq("project_id", projectId)
    .eq("type", "material")
    .order("sort_order", { ascending: true });

  return (
    <MaterialsModule
      projectId={projectId}
      initialVenue={project?.meta?.venue ?? ""}
      initialItems={(cards ?? []).map((c) => ({
        id: c.id,
        label: c.fields?.label ?? "",
        checked: c.fields?.checked ?? false,
      }))}
    />
  );
}
