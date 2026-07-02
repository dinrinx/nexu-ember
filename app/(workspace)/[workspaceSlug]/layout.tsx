// app/(workspace)/[workspaceSlug]/layout.tsx
// Общий каркас: тёмный сайдбар + основная область на светлом фоне.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("slug", workspaceSlug)
    .single();

  if (!workspace) {
    redirect("/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, type")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-page)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <Sidebar
        workspaceName={workspace.name}
        workspaceSlug={workspace.slug}
        projects={projects ?? []}
        userEmail={user.email}
      />
      <div
        className="nx-scroll"
        style={{ flex: 1, minWidth: 0, height: "100vh", overflow: "auto" }}
      >
        {children}
      </div>
    </div>
  );
}
