"use client";

import { useRef } from "react";
import { useUser } from "@/app/hooks/useUser";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const NavigateMonth = () => {
  const { month, year, setMonth, setYear } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else setMonth(month - 1);
  };

  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else setMonth(month + 1);
  };

  const handleLabelClick = () => {
    try {
      inputRef.current?.showPicker?.();
    } catch {
      inputRef.current?.click();
    }
  };

  const label = format(new Date(year, month - 1, 1), "MMM yyyy", {
    locale: ptBR,
  });

  return (
    <div
      className="flex items-center gap-1 rounded-xl p-1"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <button
        onClick={handlePrev}
        aria-label="Mês anterior"
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <FiChevronLeft className="h-4 w-4" />
      </button>

      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleLabelClick}
          className="px-3 text-sm font-medium capitalize cursor-pointer select-none"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {label}
        </button>
        {/* Input escondido — acionado via showPicker() para não sobrepor os chevrons */}
        <input
          ref={inputRef}
          type="month"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          value={`${year}-${String(month).padStart(2, "0")}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-").map(Number);
            if (!y || !m) return;
            setMonth(m);
            setYear(y);
          }}
        />
      </div>

      <button
        onClick={handleNext}
        aria-label="Próximo mês"
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--bg-hover)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <FiChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};
