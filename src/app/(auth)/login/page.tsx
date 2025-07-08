"use client";

import Link from "next/link";
import { useState } from "react";
import { loginController } from "@/controllers/user/LoginController";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";

export default function Login() {
  const { setUser } = useUser();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const user = await loginController(email, password);

      setUser(user);

      localStorage.setItem("user-finan-flow", JSON.stringify(user));
      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message);
    }
  };
  return (
    <div className="bg-gray-900 h-screen w-screen flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold  text-gray-100">Login</h1>
      <form
        className="flex flex-col gap-2 w-full max-w-md my-4 space-y-2"
        onSubmit={handleSubmit}
      >
        <input
          className="input"
          type="email"
          placeholder="Email"
          name="email"
        />
        <input
          className="input"
          type="password"
          placeholder="Senha"
          name="password"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button className="button bg-purple-950  text-gray-100" type="submit">
          Entrar
        </button>
      </form>
      <Link className="link" href="/register">
        Não tem uma conta? Cadastre-se
      </Link>
    </div>
  );
}
