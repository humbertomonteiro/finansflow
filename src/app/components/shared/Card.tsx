import { ReactNode } from "react";

interface CardProps {
  value: string | number;
  title: string;
  icon: ReactNode;
  color: string;
  highligth?: boolean;
  info?: string;
  trend?: { value: number; label: string };
  onClick?: () => void; // ← novo: torna o card clicável
}

const Card = ({
  value,
  title,
  icon,
  color,
  highligth,
  info,
  trend,
  onClick,
}: CardProps) => {
  const isPositive = trend && trend.value >= 0;
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable ? (e) => e.key === "Enter" && onClick?.() : undefined
      }
      className="relative flex flex-col gap-3 rounded-xl p-4 w-full overflow-hidden transition-all duration-200 group"
      style={{
        background: highligth
          ? "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.08) 100%)"
          : "var(--bg-surface)",
        border: highligth
          ? "1px solid var(--border-accent)"
          : "1px solid var(--border-default)",
        boxShadow: highligth
          ? "var(--shadow-accent), var(--shadow-card)"
          : "var(--shadow-card)",
        cursor: isClickable ? "pointer" : "default",
      }}
    >
      {/* Glow decorativo no highlight */}
      {highligth && (
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 pointer-events-none"
          style={{ background: "var(--accent)", filter: "blur(24px)" }}
        />
      )}

      {/* Hover overlay — só aparece quando clicável */}
      {isClickable && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)" }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{
            color: highligth ? "rgba(199,210,254,0.7)" : "var(--text-muted)",
          }}
        >
          {title}
        </p>
        <div className="flex items-center gap-2">
          {/* Ícone de "clique para ver mais" */}
          {isClickable && (
            <span
              className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                color: highligth
                  ? "rgba(199,210,254,0.6)"
                  : "var(--text-muted)",
              }}
            >
              ver detalhes
            </span>
          )}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}
            style={{ opacity: 0.9 }}
          >
            {icon}
          </div>
        </div>
      </div>

      {/* Valor */}
      <div>
        <p
          className="money text-2xl font-medium leading-none"
          style={{ color: highligth ? "#fff" : "var(--text-primary)" }}
        >
          {value}
        </p>
        {info && (
          <p
            className="text-xs mt-1.5"
            style={{
              color: highligth ? "rgba(199,210,254,0.6)" : "var(--text-muted)",
            }}
          >
            {info}
          </p>
        )}
      </div>

      {/* Trend opcional */}
      {trend && (
        <div
          className="flex items-center gap-1.5 text-xs font-medium mt-auto"
          style={{ color: isPositive ? "var(--green)" : "var(--red)" }}
        >
          <span>{isPositive ? "↑" : "↓"}</span>
          <span>
            {Math.abs(trend.value).toFixed(1)}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default Card;
