import { Aside } from "../components/template/Aside";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row">
      <Aside />
      <main className="flex-1 bg-gray-900 min-h-screen pt-16 lg:pt-6 lg:pl-[285px] px-4 sm:px-6 pb-20 lg:pb-6">
        {children}
      </main>
    </div>
  );
}
