import { NavigateMonth } from "./NavigateMonth";

export const Title = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold text-white">{children}</h2>
      <NavigateMonth />
    </div>
  );
};
