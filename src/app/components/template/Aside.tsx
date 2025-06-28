"use client";
import Link from "next/link";
import { FiHome, FiList, FiDollarSign, FiPlus } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { GoGraph } from "react-icons/go";
import { useState } from "react";
import { FormAddTransaction } from "../shared/FormAddTransaction";

export const Aside = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex bg-gray-950 text-white w-[260px] h-screen fixed top-0 left-0 flex-col justify-between shadow-lg">
        {/* Logo/Title Section */}
        <div className="">
          <Link href="/dashboard" className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <FiDollarSign className="h-6 w-6 text-indigo-400" />
              Finans Flow
            </h1>
          </Link>
          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard"
                  className="link flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-600 hover:text-indigo-400 transition-all duration-200 text-sm font-medium"
                >
                  <FiHome className="h-5 w-5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/transactions"
                  className="link flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-600 hover:text-indigo-400 transition-all duration-200 text-sm font-medium"
                >
                  <FiList className="h-5 w-5" />
                  Transações
                </Link>
              </li>
              <li>
                <Link
                  href="/performance"
                  className="link flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-600 hover:text-indigo-400 transition-all duration-200 text-sm font-medium"
                >
                  <GoGraph className="h-5 w-5" />
                  Performance
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="link flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-600 hover:text-indigo-400 transition-all duration-200 text-sm font-medium"
                >
                  <IoSettingsOutline className="h-5 w-5" />
                  Configurações
                </Link>
              </li>

              <li>
                <button
                  className="link w-full cursor-pointer flex items-center gap-3 p-3 rounded-lg border border-indigo-600 hover:bg-indigo-600 hover:text-indigo-400 transition-all duration-200 text-sm font-medium"
                  onClick={() => setShowForm(true)}
                >
                  <FiPlus className="h-5 w-5" />
                  Adicionar Transação
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-800 ">
          <p className="text-xs text-gray-400">© 2025 Finans Flow</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 h-16 flex items-center justify-around shadow-lg z-11">
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-1 text-gray-200 hover:text-indigo-400 text-xs"
        >
          <FiHome className="h-6 w-6" />
          Dashboard
        </Link>
        <Link
          href="/transactions"
          className="flex flex-col items-center gap-1 text-gray-200 hover:text-indigo-400 text-xs"
        >
          <FiList className="h-6 w-6" />
          Transações
        </Link>

        <button
          className="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 cursor-pointer"
          onClick={() => setShowForm(true)}
          aria-label="Adicionar transação"
        >
          <FiPlus className="h-6 w-6" />
        </button>
        <Link
          href="/performance"
          className="flex flex-col items-center gap-1 text-gray-200 hover:text-indigo-400 text-xs"
        >
          <GoGraph className="h-6 w-6" />
          Performance
        </Link>
        <Link
          href="/settings"
          className="flex flex-col items-center gap-1 text-gray-200 hover:text-indigo-400 text-xs"
        >
          <IoSettingsOutline className="h-6 w-6" />
          Configurações
        </Link>
      </nav>

      {/* Mobile Logo Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-gray-950 border-b border-gray-800 h-12 flex items-center px-4 z-10">
        <Link
          href="/dashboard"
          className="text-xl font-semibold text-white flex items-center gap-2"
        >
          <FiDollarSign className="h-5 w-5 text-indigo-400" />
          Finans Flow
        </Link>
      </header>

      {/* FormAddTransaction Modal */}
      {showForm && <FormAddTransaction onClose={() => setShowForm(false)} />}
    </>
  );
};
