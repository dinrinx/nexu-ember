// app/auth/callback/route.ts
// Сюда Supabase редиректит юзера после клика по ссылке в письме.
// Меняем временный "code" на настоящую сессию, а затем сами находим
// первый воркспейс юзера и ведём сразу туда — а не на пустой корень сайта.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // если адрес назначения не был передан явно — сами находим
      // первый воркспейс, в котором состоит юзер, и ведём туда
      if (explicitNext) {
        return NextResponse.redirect(`${origin}${explicitNext}`);
      }

      const { data: membership } = await supabase
        .from("memberships")
        .select("workspace_id, workspaces(slug)")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      const slug = (membership?.workspaces as any)?.slug;
      const destination = slug ? `/${slug}` : "/";

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
