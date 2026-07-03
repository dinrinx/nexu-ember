"use client";

// app/(auth)/login/page.tsx
// Вход по одноразовому коду (без magic link) — снова в двухколоночном
// оформлении: тёмная брендовая панель слева, форма справа.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "verifying" | "error"
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
      setErrorMsg(
        `${error.message || "Неизвестная ошибка"} (код: ${(error as any).status ?? "—"})`,
      );
      console.error("signInWithOtp error:", error);
      return;
    }

    setStatus("idle");
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
      setErrorMsg(
        `${error?.message || "Не получилось подтвердить код"} (код: ${(error as any)?.status ?? "—"})`,
      );
      console.error("verifyOtp error:", error);
      return;
    }

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
          maxWidth: "920px",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(20,20,20,0.12)",
          background: "#fff",
        }}
      >
        {/* левая тёмная панель — бренд */}
        <div
          style={{
            background: "var(--sidebar-bg)",
            color: "var(--sidebar-ink)",
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "520px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "var(--accent)",
                display: "inline-block",
                boxShadow: "0 0 0 4px rgba(255,90,31,0.18)",
              }}
            />
            <span
              style={{
                fontSize: "17px",
                fontWeight: 700,
                letterSpacing: "-0.2px",
              }}
            >
              NEXU Ember
            </span>
          </div>

          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.4px",
                color: "var(--sidebar-ink-dim)",
                marginBottom: "16px",
              }}
            >
              Метод снежинки
            </div>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.5px",
              }}
            >
              От искры замысла
              <br />
              до готовой структуры
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--sidebar-ink-dim)",
                margin: "18px 0 0",
                maxWidth: "320px",
              }}
            >
              Рабочая тетрадь для фанфиков, книг и выступлений.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <span
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "var(--type-fanfic-bg)",
                border: "2px solid var(--sidebar-bg)",
              }}
            />
            <span
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "var(--type-book-bg)",
                border: "2px solid var(--sidebar-bg)",
                marginLeft: "-10px",
              }}
            />
            <span
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "var(--type-talk-bg)",
                border: "2px solid var(--sidebar-bg)",
                marginLeft: "-10px",
              }}
            />
          </div>
        </div>

        {/* правая часть — форма */}
        <div
          style={{
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {step === "email" ? (
            <form onSubmit={handleSendCode}>
              <h1
                style={{
                  fontSize: "24px",
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
                  margin: "0 0 26px",
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
                  fontSize: "24px",
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
                  margin: "0 0 26px",
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
                  setErrorMsg("");
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
  lineHeight: 1.5,
};
