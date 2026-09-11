"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Play, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type Festa = {
  id: string;
  nome: string;
  data: string;
};

export default function Home() {
  const [festas, setFestas] = useState<Festa[]>([]);

  useEffect(() => {
    async function fetchFestas() {
      const { data } = await supabase.from("festas").select("*").order("data", { ascending: false });
      if (data) setFestas(data);
    }
    fetchFestas();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ijọba Cantigas</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/admin" className="p-2 bg-gray-200 dark:bg-gray-800 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-white">
            <Settings size={20} />
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Selecione uma Festa para iniciar:</h2>
        
        {festas.length === 0 ? (
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Nenhuma festa cadastrada ainda.</p>
            <Link href="/admin/festas" className="text-blue-600 hover:underline">
              Vá para o painel para criar uma
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {festas.map((festa) => (
              <Link 
                key={festa.id} 
                href={`/player/${festa.id}`}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <div>
                  <h3 className="font-bold text-lg">{festa.nome}</h3>
                  <span className="text-sm text-gray-500">
                    {festa.data ? new Date(festa.data).toLocaleDateString('pt-BR') : 'Sem data'}
                  </span>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full text-blue-600 dark:text-blue-400">
                  <Play fill="currentColor" size={24} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
