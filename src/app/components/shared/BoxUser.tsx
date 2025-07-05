"use client";

import { useUser } from "@/app/hooks/useUser";
import { User } from "@/domain/entities/user/User";
import { useState } from "react";

import { CiEdit } from "react-icons/ci";
import { FaCheck } from "react-icons/fa6";

export const BoxUser = () => {
  const { user, updateUser } = useUser();
  const [edit, setEdit] = useState(false);
  const [newName, setnewName] = useState<string>(user?.name || "");

  const handleUpdateUser = () => {
    updateUser({ name: newName });
  };

  return (
    <div className="bg-gray-900 p-4 rounded-2xl flex justify-between items-start gap-4 w-full ">
      <div className="flex gap-4">
        <div className="h-12 w-12 rounded-full bg-gray-800 flex justify-center items-center font-semibold">
          {user?.name[0]}
          {user?.name[1]}
        </div>
        <div>
          {edit ? (
            <input
              className="input mb-2"
              type="text"
              value={newName}
              onChange={(e) => setnewName(e.target.value)}
              placeholder="Digite seu nome..."
            />
          ) : (
            <p className="text-lg">{user?.name}</p>
          )}
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {edit && (
          <button
            onClick={handleUpdateUser}
            className="py-2 px-4 rounded-lg text-gray-200 hover:bg-green-500 transition-all cursor-pointer"
          >
            <FaCheck className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={() => setEdit(!edit)}
          className="py-2 px-4 rounded-lg hover:bg-violet-800 transition-all cursor-pointer"
        >
          <CiEdit className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
