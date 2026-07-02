// app/(workspace)/[workspaceSlug]/[projectId]/spark/page.tsx

import { createClient } from "@/lib/supabase/server";
import { SparkModule } from "@/components/modules/SparkModule";

export default async function SparkPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("type")
    .eq("id", projectId)
    .single();

  const { data: card } = await supabase
    .from("cards")
    .select("id, fields")
    .eq("project_id", projectId)
    .eq("type", "concept")
    .maybeSingle();

  return (
    <SparkModule
      projectId={projectId}
      projectType={project?.type ?? "fanfic"}
      cardId={card?.id ?? null}
      initial={{
        logline: card?.fields?.logline ?? "",
        expand: card?.fields?.expand ?? "",
        theme: card?.fields?.theme ?? "",
        bloom: {
          remember: card?.fields?.bloom?.remember ?? "",
          understand: card?.fields?.bloom?.understand ?? "",
          apply: card?.fields?.bloom?.apply ?? "",
          analyze: card?.fields?.bloom?.analyze ?? "",
        },
        entryPoint: card?.fields?.entryPoint ?? "",
      }}
    />
  );
}
