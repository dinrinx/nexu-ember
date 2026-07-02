// app/(workspace)/[workspaceSlug]/[projectId]/scroll/page.tsx

import { createClient } from "@/lib/supabase/server";
import { ScrollModule } from "@/components/modules/ScrollModule";

export default async function ScrollPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("cards")
    .select("id, fields")
    .eq("project_id", projectId)
    .eq("type", "synopsis")
    .maybeSingle();

  return (
    <ScrollModule
      projectId={projectId}
      cardId={card?.id ?? null}
      initial={{
        short: card?.fields?.short ?? "",
        full: card?.fields?.full ?? "",
      }}
    />
  );
}
