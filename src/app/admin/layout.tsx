import Link from 'next/link';
import { Home, ListMusic, Music, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Ijọba Admin</h1>
          <ThemeToggle />
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <Link href="/admin" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/orixas" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
            <Users size={20} />
            <span>Orixás</span>
          </Link>
          <Link href="/admin/cantigas" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
            <Music size={20} />
            <span>Cantigas</span>
          </Link>
          <Link href="/admin/festas" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
            <ListMusic size={20} />
            <span>Festas (Setlists)</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto text-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
}
