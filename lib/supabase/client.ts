// lib/supabase/client.ts
// Клиент для браузера — используется во всех "use client" компонентах
// (формы, интерактивные карточки, всё, что реагирует на клики сразу).

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
