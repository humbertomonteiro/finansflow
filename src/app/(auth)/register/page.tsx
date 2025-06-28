"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerController } from "@/controllers/user/RegisterController";

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (password !== confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (password.length < 8) {
        throw new Error("A senha deve ter pelo menos 8 caracteres");
      }

      await registerController(name, email, password);
      setError(null);
      router.push("/login");
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold">Cadastro</h1>
      <form
        className="flex flex-col gap-2 w-full max-w-md my-4"
        onSubmit={handleSubmit}
      >
        <input name="name" className="input" type="text" placeholder="Nome" />
        <input
          name="email"
          className="input"
          type="email"
          placeholder="Email"
        />
        <input
          name="password"
          className="input"
          type="password"
          placeholder="Senha"
        />
        <input
          name="confirmPassword"
          className="input"
          type="password"
          placeholder="Confirmar senha"
        />
        {error && <p className="text-red-500">{error}</p>}

        <button className="button bg-purple-950" type="submit">
          Cadastrar
        </button>
      </form>
      <Link className="link" href="/login">
        Já tem uma conta? Faça login
      </Link>
    </div>
  );
}
