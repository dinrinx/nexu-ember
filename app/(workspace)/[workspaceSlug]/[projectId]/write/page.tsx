// app/(workspace)/[workspaceSlug]/[projectId]/write/page.tsx

import { createClient } from "@/lib/supabase/server";
import { WriteModule } from "@/components/modules/WriteModule";

export default async function WritePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, title, content, word_count")
    .eq("project_id", projectId)
    .eq("level", "chapter")
    .order("sort_order", { ascending: true });

  return (
    <WriteModule
      projectId={projectId}
      initial={(blocks ?? []).map((b) => ({
        id: b.id,
        title: b.title ?? "",
        content: b.content ?? "",
        wordCount: b.word_count ?? 0,
      }))}
    />
  );
}
