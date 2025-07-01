import { ReactNode } from "react";

interface CardProps {
  value: string | number;
  title: string;
  icon: ReactNode;
  color: string;
  bg?: string;
}

const Card = ({ value, title, icon, color, bg }: CardProps) => {
  return (
    <div
      className={`flex flex-col gap-2 ${
        bg ? bg : "bg-gray-900"
      } border border-gray-800 
     rounded-xl p-4 md:p-4 w-full shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
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
