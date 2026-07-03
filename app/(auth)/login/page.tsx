"use client";

// app/(auth)/login/page.tsx
// Вход по одноразовому коду из письма (вместо ссылки) — код вводится прямо
// в форме, без перехода на отдельный /auth/callback. Полностью происходит
// в браузере, поэтому не зависит от особенностей серверного окружения.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "verifying" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("sent");
    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("verifying");
    setErrorMsg("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error || !data.user) {
      setStatus("error");
      setErrorMsg(error?.message ?? "Не получилось подтвердить код");
      return;
    }

    // ищем первый воркспейс юзера и ведём сразу туда
    const { data: membership } = await supabase
      .from("memberships")
      .select("workspaces(slug)")
      .eq("user_id", data.user.id)
      .limit(1)
      .maybeSingle();

    const slug = (membership?.workspaces as any)?.slug;
    router.push(slug ? `/${slug}` : "/");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "var(--bg-page)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#fff",
          borderRadius: "24px",
          padding: "44px",
          boxShadow: "0 24px 60px rgba(20,20,20,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          <span
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "15px", fontWeight: 700 }}>NEXU Ember</span>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode}>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.4px",
                margin: "0 0 8px",
              }}
            >
              Вход
            </h1>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--ink-dim)",
                margin: "0 0 24px",
              }}
            >
              Пришлём код на почту — без пароля.
            </p>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={buttonStyle}
            >
              {status === "sending" ? "Отправляю…" : "Получить код"}
            </button>
            {status === "error" && <p style={errorStyle}>{errorMsg}</p>}
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.4px",
                margin: "0 0 8px",
              }}
            >
              Введите код
            </h1>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--ink-dim)",
                margin: "0 0 24px",
              }}
            >
              Отправили 6-значный код на <strong>{email}</strong>
            </p>
            <label style={labelStyle}>Код из письма</label>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              required
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              style={{
                ...inputStyle,
                fontSize: "22px",
                letterSpacing: "6px",
                textAlign: "center",
              }}
            />
            <button
              type="submit"
              disabled={status === "verifying" || code.length < 6}
              style={buttonStyle}
            >
              {status === "verifying" ? "Проверяю…" : "Войти"}
            </button>
            {status === "error" && <p style={errorStyle}>{errorMsg}</p>}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setStatus("idle");
              }}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "var(--ink-faint)",
                fontSize: "13px",
                marginTop: "16px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Отправить код на другую почту
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  color: "var(--ink-faint)",
  display: "block",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "14px 16px",
  fontSize: "15px",
  background: "var(--bg-page)",
  outline: "none",
  marginBottom: "18px",
  fontFamily: "var(--font-sans)",
  color: "var(--ink)",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--black)",
  color: "#fff",
  border: "none",
  borderRadius: "999px",
  padding: "14px",
  fontWeight: 700,
  fontSize: "14px",
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#c0392b",
  marginTop: "14px",
};
