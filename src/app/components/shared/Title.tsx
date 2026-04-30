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
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}
      >
        {children}
      </h2>
      {navigateMonth && <NavigateMonth />}
    </div>
  );
};
