"use client";

import { Title } from "../../components/shared/Title";
import { BoxUser } from "@/app/components/shared/BoxUser";

import {
  MdOutlineAccountBalance,
  MdOutlineCategory,
  MdOutlineReplay,
  MdOutlineBalance,
} from "react-icons/md";
import { IoExitOutline } from "react-icons/io5";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";

export default function Settings() {
  const { user, logout, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  if (loading) {
    return <p className="text-gray-400 p-6">Carregando...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={false}>Configurações</Title>

      <BoxUser />

      <ul className="text-gray-400 flex flex-col bg-gray-900 py-2 px-2 rounded-2xl">
        <li className="flex gap-4 p-4 hover:bg-gray-800 transition-all cursor-pointer border-b border-b-gray-800 hover:rounded-xl">
          <MdOutlineAccountBalance className="h-5 w-5" /> Contas
        </li>
        <li className="flex gap-4 p-4 hover:bg-gray-800 transition-all cursor-pointer border-b border-b-gray-800 hover:rounded-xl">
          <MdOutlineCategory className="h-5 w-5" />
          Categorias
        </li>
        <li className="flex gap-4 p-4 hover:bg-gray-800 transition-all cursor-pointer border-b border-b-gray-800 hover:rounded-xl">
          <MdOutlineBalance className="h-5 w-5" />
          Ajustar Saldo
        </li>
        <li className="flex gap-4 p-4 hover:bg-gray-800 transition-all cursor-pointer border-b border-b-gray-800 hover:rounded-xl">
          {" "}
          <MdOutlineReplay className="h-5 w-5" /> Começar do zero{" "}
        </li>
        <li
          onClick={handleLogout}
          className="flex gap-4 p-4 hover:bg-red-800 hover:text-gray-200 transition-all cursor-pointer  hover:rounded-xl"
        >
          <div className="flex items-center gap-4">
            <IoExitOutline className="h-5 w-5" />
            {loading ? "Carregando..." : "Sair"}
          </div>
        </li>
      </ul>
    </div>
  );
}
