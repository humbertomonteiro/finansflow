"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerController } from "@/controllers/user/RegisterController";
import {
  FiUser,
  FiMail,
  FiLock,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (password !== confirmPassword)
        throw new Error("As senhas não coincidem");
      if (password.length < 8)
        throw new Error("A senha deve ter pelo menos 8 caracteres");

      await registerController(name, email, password);
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "name",
      type: "text",
      placeholder: "Seu nome completo",
      icon: FiUser,
      label: "Nome",
    },
    {
      name: "email",
      type: "email",
      placeholder: "seu@email.com",
      icon: FiMail,
      label: "Email",
    },
    {
      name: "password",
      type: "password",
      placeholder: "Mín. 8 caracteres",
      icon: FiLock,
      label: "Senha",
    },
    {
      name: "confirmPassword",
      type: "password",
      placeholder: "Repita a senha",
      icon: FiLock,
      label: "Confirmar senha",
    },
  ] as const;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "var(--accent)", filter: "blur(80px)" }}
      />

      <div className="w-full max-w-sm animate-fade-in-scale">
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
            Criar conta
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Comece a controlar suas finanças agora
          </p>
        </div>

        <div
          className="p-6 rounded-2xl"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {fields.map(({ name, type, placeholder, icon: Icon, label }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {label}
                </label>
                <div className="relative">
                  <Icon
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <input
                    className="input"
                    style={{ paddingLeft: "2.25rem" }}
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    required
                  />
                </div>
              </div>
            ))}

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm animate-fade-in"
                style={{ background: "var(--red-dim)", color: "var(--red)" }}
              >
                <FiAlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="button button-primary w-full mt-1"
            >
              {loading ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" /> Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </button>
          </form>
        </div>

        <p
          className="text-center text-sm mt-5"
          style={{ color: "var(--text-muted)" }}
        >
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium transition-colors"
            style={{ color: "var(--accent-light)" }}
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
