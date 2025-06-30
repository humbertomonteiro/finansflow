import { useUser } from "@/app/hooks/useUser";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";

export const NavigateMonth = () => {
  const { month, year, setMonth, setYear } = useUser();

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-gray-950 rounded-full p-1 shadow-sm">
      <button
        className="flex items-center bg-gray-800 hover:bg-indigo-600 text-gray-400 font-medium text-sm p-2 rounded-full transition-colors duration-200 cursor-pointer"
        onClick={handlePreviousMonth}
        aria-label="Mês anterior"
      >
        <FiChevronLeft className="h-5 w-5" />
      </button>
      <label className="flex items-center gap-1 text-white font-medium">
        <span className="text-sm">
          {month < 10 ? `0${month}` : month}/{year}
        </span>
        <div className="relative">
          <FiCalendar className="h-5 w-5 text-indigo-400 cursor-pointer" />
          <input
            className="absolute inset-0 opacity-0 cursor-pointer"
            type="month"
            value={`${year}-${month < 10 ? `0${month}` : month}`}
            onChange={(e) => {
              const date = new Date(e.target.value);
              setMonth(date.getMonth() + 2);
              setYear(date.getFullYear());
            }}
            aria-label="Selecionar mês e ano"
          />
        </div>
      </label>
      <button
        className="flex items-center bg-gray-800 hover:bg-indigo-600 text-gray-400 font-medium text-sm p-2 rounded-full transition-colors duration-200 cursor-pointer"
        onClick={handleNextMonth}
        aria-label="Próximo mês"
      >
        <FiChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};
