// lib/supabase/server.ts
// Клиент для сервера — используется в серверных компонентах (page.tsx без "use client")
// и в route handlers. Работает с cookies через next/headers, поэтому сессия
// пользователя доступна сразу при первом рендере страницы, без мигания "не залогинен".

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll вызывается из Server Component, где менять cookies нельзя —
            // это нормально, если рядом есть middleware, который освежает сессию.
          }
        },
      },
    },
  );
}
