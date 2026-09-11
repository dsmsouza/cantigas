import Link from "next/link";
import { Settings, Music, Calendar, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden min-w-0 w-full">
        <div className="hidden md:flex justify-end mb-4"><ThemeToggle /></div>
        {children}
      </main>
    </div>
  );
}
