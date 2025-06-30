import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen flex-col bg-gray-950">
      <h1 className="text-6xl text-gray-100 mb-2">Finans Flow</h1>
      <p className="text-lg text-gray-400 mb-2">A vida financeira que flui.</p>
      <div className="flex gap-4">
        <Link className="button bg-violet-900 text-gray-100" href="/login">
          Login
        </Link>
        <Link className="button bg-blue-900 text-gray-100" href="/register">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
