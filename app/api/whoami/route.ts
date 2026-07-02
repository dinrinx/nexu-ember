// app/api/whoami/route.ts
// Временный диагностический эндпоинт — показывает, видит ли сервер сессию.
// Удали этот файл, когда разберёмся с проблемой логина.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  return NextResponse.json({ user: data.user, error: error?.message ?? null });
}
