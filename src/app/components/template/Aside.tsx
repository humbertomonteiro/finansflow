"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiList, FiPlus, FiTarget } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { GoGraph } from "react-icons/go";
import { useState } from "react";
import { FormAddTransaction } from "../shared/FormAddTransaction";
import { useUser } from "@/app/hooks/useUser";

const navItems = [
  { href: "/dashboard", icon: FiHome, label: "Dashboard" },
  { href: "/transactions", icon: FiList, label: "Transações" },
  { href: "/performance", icon: GoGraph, label: "Performance" },
  { href: "/goals", icon: FiTarget, label: "Metas" },
  { href: "/settings", icon: IoSettingsOutline, label: "Configurações" },
];

export const Aside = () => {
  const [showForm, setShowForm] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col justify-between fixed top-0 left-0 h-screen w-[240px] z-20"
        style={{
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-6 py-7 group"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "var(--accent)",
                boxShadow: "0 0 12px var(--accent-glow)",
              }}
            >
              <span className="text-white font-bold text-xs">FF</span>
            </div>
            <span
              className="font-semibold text-base tracking-tight transition-colors"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              FinansFlow
            </span>
          </Link>

          {/* Perfil mini */}
          {user && (
            <div
              className="mx-4 mb-4 px-3 py-2.5 rounded-xl flex items-center gap-3"
              style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{
                  background: "var(--accent-dim)",
                  color: "var(--accent-light)",
                  border: "1px solid var(--border-accent)",
                }}
              >
                {user.name?.[0]?.toUpperCase()}
                {user.name?.[1]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {user.name}
                </p>
                <p
                  className="text-[0.65rem] truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="px-3">
            <p
              className="text-[0.6rem] font-semibold uppercase tracking-widest px-3 mb-2"
              style={{ color: "var(--text-disabled)" }}
            >
              Menu
            </p>
            <ul className="space-y-0.5">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                      style={{
                        background: active
                          ? "var(--accent-dim)"
                          : "transparent",
                        color: active
                          ? "var(--accent-light)"
                          : "var(--text-secondary)",
                        border: active
                          ? "1px solid var(--border-accent)"
                          : "1px solid transparent",
                      }}
                    >
                      <Icon
                        className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          color: active
                            ? "var(--accent-light)"
                            : "var(--text-muted)",
                        }}
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Botão adicionar */}
            <div className="mt-4">
              <button
                onClick={() => setShowForm(true)}
                className="button button-primary w-full"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <FiPlus className="h-4 w-4" />
                Nova Transação
              </button>
            </div>
          </nav>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <p
            className="text-[0.65rem]"
            style={{ color: "var(--text-disabled)" }}
          >
            © 2025 FinansFlow
          </p>
        </div>
      </aside>

      {/* ── Mobile Header ───────────────────────────── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-20"
        style={{
          background: "rgba(7,11,20,0.9)",
          borderBottom: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <span className="text-white font-bold text-[0.6rem]">FF</span>
          </div>
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            FinansFlow
          </span>
        </Link>
        <button
          onClick={() => setShowForm(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{
            background: "var(--accent)",
            boxShadow: "0 0 12px var(--accent-glow)",
          }}
          aria-label="Nova transação"
        >
          <FiPlus className="h-4 w-4 text-white" />
        </button>
      </header>

      {/* ── Mobile Bottom Nav ────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around z-20 px-2"
        style={{
          background: "rgba(13,18,32,0.95)",
          borderTop: "1px solid var(--border-subtle)",
          backdropFilter: "blur(12px)",
        }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all"
              style={{
                color: active ? "var(--accent-light)" : "var(--text-muted)",
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[0.6rem] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {showForm && <FormAddTransaction onClose={() => setShowForm(false)} />}
    </>
  );
};
