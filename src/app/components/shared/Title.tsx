import { NavigateMonth } from "./NavigateMonth";

export const Title = ({
  children,
  navigateMonth,
}: {
  children: React.ReactNode;
  navigateMonth: boolean;
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold text-gray-300 ml-1">{children}</h2>
      {navigateMonth && <NavigateMonth />}
    </div>
  );
};
