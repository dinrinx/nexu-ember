// app/(workspace)/[workspaceSlug]/[projectId]/qa/page.tsx

import { createClient } from "@/lib/supabase/server";
import { QAModule } from "@/components/modules/QAModule";

export default async function QAPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, fields")
    .eq("project_id", projectId)
    .eq("type", "qa")
    .order("sort_order", { ascending: true });

  return (
    <QAModule
      projectId={projectId}
      initial={(cards ?? []).map((c) => ({
        id: c.id,
        question: c.fields?.question ?? "",
        answer: c.fields?.answer ?? "",
        frequent: c.fields?.frequent ?? false,
      }))}
    />
  );
}
