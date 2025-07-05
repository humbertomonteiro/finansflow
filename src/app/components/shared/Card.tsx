import { ReactNode } from "react";

interface CardProps {
  value: string | number;
  title: string;
  icon: ReactNode;
  color: string;
  highligth?: boolean;
  info?: string;
}

const Card = ({ value, title, icon, color, highligth, info }: CardProps) => {
  return (
    <div
      className={`flex flex-col gap-1 ${
        highligth ? "bg-violet-800" : "bg-gray-900"
      } border border-gray-800 
     rounded-xl p-4 md:p-4 w-full shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex justify-between items-center">
        <h3
          className={` text-sm ${
            highligth ? "text-gray-300" : "text-gray-500"
          }`}
        >
          {title}
        </h3>
        <div
          className={`p-0.5 md:p-1 ${color} text-base md:text-2xl rounded-full`}
        >
          {icon}
        </div>
      </div>
      <h2
        className={`text-gray-200 ${
          highligth ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"
        }`}
      >
        {value}
      </h2>
      <span
        className={` text-xs ${highligth ? "text-gray-300" : "text-gray-500"}`}
      >
        {info}
      </span>
    </div>
  );
};

export default Card;
