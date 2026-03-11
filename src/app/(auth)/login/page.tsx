"use client";

import Link from "next/link";
import { useState } from "react";
import { loginController } from "@/controllers/user/LoginController";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";
import { FiMail, FiLock, FiAlertCircle, FiLoader } from "react-icons/fi";

export default function Login() {
  const { setUser } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const user = await loginController(email, password);
      setUser(user);
      if (typeof window !== "undefined") {
        localStorage.setItem("user-finan-flow", JSON.stringify(user));
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Erro ao entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Glow de fundo */}
      <div
        className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "var(--accent)", filter: "blur(80px)" }}
      />

      <div className="w-full max-w-sm animate-fade-in-scale">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "var(--accent)",
              boxShadow: "0 0 32px var(--accent-glow)",
            }}
          >
            <span className="text-white font-bold text-base">FF</span>
          </div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Bem-vindo de volta
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Card */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <div className="relative">
                <FiMail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  className="input"
                  style={{ paddingLeft: "2.25rem" }}
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Senha
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  className="input"
                  style={{ paddingLeft: "2.25rem" }}
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm animate-fade-in"
                style={{ background: "var(--red-dim)", color: "var(--red)" }}
              >
                <FiAlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="button button-primary w-full mt-1"
            >
              {loading ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        {/* Link cadastro */}
        <p
          className="text-center text-sm mt-5"
          style={{ color: "var(--text-muted)" }}
        >
          Não tem uma conta?{" "}
          <Link
            href="/register"
            className="font-medium transition-colors"
            style={{ color: "var(--accent-light)" }}
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
