"use client";

import { Title } from "../../components/shared/Title";
import {
  MdOutlineAccountBalance,
  MdOutlineCategory,
  MdOutlineReplay,
} from "react-icons/md";
import { FaBalanceScaleLeft } from "react-icons/fa";

import { useUser } from "@/app/hooks/useUser";

export default function Settings() {
  const { user } = useUser();
  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={false}>Configurações</Title>

      <div className="bg-gray-900 p-4 rounded-2xl flex justify-between items-start gap-4 w-full">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-800 flex justify-center items-center font-semibold">
            {user?.name[0]}
            {user?.name[1]}
          </div>
          <div>
            <p className="text-lg">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button className="button bg-violet-800">Editar</button>
      </div>

      <ul className="text-gray-400 flex flex-col gap-2 bg-gray-900 p-4 rounded-2xl">
        <li className="border-b border-b-gray-700 pb-2 flex gap-4">
          <MdOutlineAccountBalance className="h-5 w-5" /> Criar conta
        </li>
        <li className="border-b border-b-gray-700 pb-2 flex gap-4">
          <MdOutlineCategory className="h-5 w-5" />
          Criar categoria
        </li>
        <li className="border-b border-b-gray-700 pb-2 flex gap-4">
          <FaBalanceScaleLeft className="h-5 w-5" />
          Ajustar Saldo
        </li>
        <li className="flex gap-4">
          {" "}
          <MdOutlineReplay className="h-5 w-5" /> Começar do zero{" "}
        </li>
      </ul>
      <div className="">
        <button className="button text-gray-200 bg-red-700">Sair</button>
      </div>
    </div>
  );
}
