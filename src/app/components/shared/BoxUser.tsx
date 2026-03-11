"use client";

import { useUser } from "@/app/hooks/useUser";
import { useState } from "react";
import { CiEdit } from "react-icons/ci";
import { FiCheck, FiX } from "react-icons/fi";

export const BoxUser = () => {
  const { user, updateUser } = useUser();
  const [edit, setEdit] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");

  const handleSave = () => {
    if (newName.trim().length >= 2) {
      updateUser({ name: newName.trim() });
    }
    setEdit(false);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  return (
    <div
      className="flex items-center justify-between gap-4 p-4 rounded-xl"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent-light)",
            border: "1px solid var(--border-accent)",
          }}
        >
          {initials}
        </div>

        {/* Info */}
        <div>
          {edit ? (
            <input
              className="input h-8 text-sm"
              style={{ width: "160px" }}
              type="text"
              value={newName}
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          ) : (
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.name}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {edit ? (
          <>
            <button
              onClick={handleSave}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              style={{ background: "var(--green-dim)", color: "var(--green)" }}
            >
              <FiCheck className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setEdit(false);
                setNewName(user?.name || "");
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <FiX className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setEdit(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <CiEdit className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
