"use client";

import Link from "next/link";
import { Settings, Music, Calendar, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loadingAuth, login, logout } = useAuth();
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(pinInput);
    if (!success) {
      setError(true);
    }
  };

  if (loadingAuth) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center">Acesso Restrito</h2>
          {error && <p className="text-red-500 mb-4 text-center">Senha incorreta!</p>}
          <input
            type="password"
            placeholder="Digite o PIN do Ogã"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full p-3 border rounded mb-4 text-center text-xl tracking-widest bg-gray-50 dark:bg-gray-900"
            autoFocus
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">
            Entrar
          </button>
          <Link href="/" className="block text-center mt-6 text-blue-500 hover:underline">
            Voltar para o Início
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
      <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-b md:border-r dark:border-gray-700">
        <div className="p-4 md:p-6 flex justify-between items-center md:block">
          <h1 className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">Ijọba Admin</h1>
          <div className="md:hidden"><ThemeToggle /></div>
        </div>
        <nav className="flex md:flex-col overflow-x-auto p-4 md:p-6 gap-2 border-t md:border-t-0 dark:border-gray-700">
          <Link href="/admin" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded whitespace-nowrap"><LayoutDashboard size={20}/> Dashboard</Link>
          <Link href="/admin/orixas" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded whitespace-nowrap"><Settings size={20}/> Orixás</Link>
          <Link href="/admin/cantigas" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded whitespace-nowrap"><Music size={20}/> Cantigas</Link>
          <Link href="/admin/festas" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded whitespace-nowrap"><Calendar size={20}/> Festas</Link>
          <Link href="/" className="flex items-center gap-2 p-2 mt-0 md:mt-8 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded whitespace-nowrap">Ir para o Player</Link>
          <button onClick={logout} className="flex items-center gap-2 p-2 mt-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded whitespace-nowrap text-left">Sair</button>
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden min-w-0 w-full">
        <div className="hidden md:flex justify-end mb-4"><ThemeToggle /></div>
        {children}
      </main>
    </div>
  );
}
