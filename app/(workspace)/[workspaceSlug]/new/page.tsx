// app/(workspace)/[workspaceSlug]/new/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "@/components/forms/NewProjectForm";

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, slug")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) {
    return (
      <p style={{ padding: "44px", color: "#c0392b" }}>Воркспейс не найден.</p>
    );
  }

  return (
    <div style={{ padding: "36px 44px", maxWidth: "760px" }}>
      <Link
        href={`/${workspaceSlug}`}
        style={{
          color: "var(--ink-dim)",
          fontSize: "13px",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "20px",
        }}
      >
        ← Назад в мастерскую
      </Link>

      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.4px",
          color: "var(--ink-faint)",
          marginBottom: "8px",
        }}
      >
        Новый проект
      </div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "-0.5px",
          margin: "0 0 30px",
        }}
      >
        С чего начнём?
      </h1>

      <NewProjectForm
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
      />
    </div>
  );
}
