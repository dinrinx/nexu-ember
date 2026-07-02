"use client";

// app/(auth)/login/page.tsx
// Двухколоночный логин по редизайну: тёмная брендовая панель слева, форма справа.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setStatus(error ? "error" : "sent");
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
              Рабочая тетрадь для фанфиков, книг и выступлений. Шесть модулей,
              которые разворачивают идею в сюжет.
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
          {status === "sent" ? (
            <div>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "var(--status-done-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "22px",
                }}
              >
                <span style={{ fontSize: "22px" }}>✓</span>
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  letterSpacing: "-0.4px",
                  margin: "0 0 10px",
                }}
              >
                Письмо отправлено
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "var(--ink-dim)",
                  margin: "0 0 6px",
                }}
              >
                Ссылка для входа отправлена на
              </p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  margin: "0 0 26px",
                }}
              >
                {email}
              </p>
              <button
                onClick={() => setStatus("idle")}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: "var(--ink-dim)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "999px",
                  padding: "14px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Отправить снова
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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
                Введите email — пришлём ссылку для входа без пароля.
              </p>
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  color: "var(--ink-faint)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
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
                }}
              />
              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  width: "100%",
                  background: "var(--black)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "999px",
                  padding: "14px",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  opacity: status === "sending" ? 0.7 : 1,
                }}
              >
                {status === "sending" ? "Отправляю…" : "Получить ссылку"}
              </button>
              {status === "error" && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#c0392b",
                    marginTop: "14px",
                  }}
                >
                  Что-то пошло не так, попробуй ещё раз.
                </p>
              )}
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "var(--ink-faint)",
                  margin: "18px 0 0",
                  textAlign: "center",
                }}
              >
                Продолжая, вы соглашаетесь с условиями использования сервиса.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
