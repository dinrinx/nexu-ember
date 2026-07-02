// app/(workspace)/[workspaceSlug]/[projectId]/ash/page.tsx

import { createClient } from "@/lib/supabase/server";
import { AshModule } from "@/components/modules/AshModule";

export default async function AshPage({
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
    .eq("type", "notes")
    .maybeSingle();

  return (
    <AshModule
      projectId={projectId}
      cardId={card?.id ?? null}
      initial={{
        notes: card?.fields?.notes ?? "",
        sources: card?.fields?.sources ?? [],
      }}
    />
  );
}
