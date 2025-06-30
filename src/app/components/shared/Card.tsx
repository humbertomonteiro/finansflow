import { ReactNode } from "react";

interface CardProps {
  value: string | number;
  title: string;
  icon: ReactNode;
  color: string;
}

const Card = ({ value, title, icon, color }: CardProps) => {
  return (
    <div className="flex flex-col gap-4 bg-gray-950 color-white border border-gray-800 rounded-xl p-4 md:p-4 w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-center">
        <h3 className="text-gray-400">{title}</h3>
        <div
          className={`p-0.5 md:p-1 ${color} text-base md:text-2xl rounded-full`}
        >
          {icon}
        </div>
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-100">
        {value}
      </h2>
    </div>
  );
};

export default Card;
