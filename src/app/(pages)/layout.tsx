import { Aside } from "../components/template/Aside";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row overflow-x-hidden bg-red-500">
      <Aside />
      <main className="flex-1 bg-gray-800 min-h-screen pt-18 lg:pt-6 lg:pl-[285px] px-2 sm:px-6 pb-20 lg:pb-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
