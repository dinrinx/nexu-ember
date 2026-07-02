// app/(workspace)/[workspaceSlug]/[projectId]/quake/page.tsx

import { createClient } from "@/lib/supabase/server";
import { QuakeModule } from "@/components/modules/QuakeModule";

export default async function QuakePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, fields, sort_order")
    .eq("project_id", projectId)
    .eq("type", "disaster")
    .order("sort_order", { ascending: true });

  const byN = new Map(
    (cards ?? []).map((c) => [c.fields?.n ?? c.sort_order + 1, c]),
  );

  const items = [1, 2, 3].map((n) => {
    const c = byN.get(n);
    return {
      id: c?.id ?? null,
      n,
      title: c?.fields?.title ?? "",
      text: c?.fields?.text ?? "",
    };
  });

  return <QuakeModule projectId={projectId} initial={items} />;
}
