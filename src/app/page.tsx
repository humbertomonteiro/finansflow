import Link from "next/link";

export default function Home() {
  return (
    <div className="flex justify-center items-center min-h-screen flex-col">
      <h1 className="text-6xl text-gray-100 mb-2">Finans Flow</h1>
      <p className="text-lg text-gray-400 mb-2">A vida financeira que flui.</p>
      <div className="flex gap-4">
        <Link className="button bg-violet-900" href="/login">
          Login
        </Link>
        <Link className="button bg-blue-900" href="/register">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
