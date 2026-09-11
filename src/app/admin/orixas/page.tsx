"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

type Orixa = {
  id: string;
  nome: string;
  ordem_padrao: number;
  cor_tema: string;
};

export default function OrixasPage() {
  const [orixas, setOrixas] = useState<Orixa[]>([]);
  const [nome, setNome] = useState("");
  const [ordemPadrao, setOrdemPadrao] = useState("");
  const [corTema, setCorTema] = useState("#000000");

  useEffect(() => {
    fetchOrixas();
  }, []);

  async function fetchOrixas() {
    const { data, error } = await supabase
      .from("orixas")
      .select("*")
      .order("ordem_padrao", { ascending: true });
    
    if (data) setOrixas(data);
    if (error) console.error("Erro ao buscar Orixás:", error);
  }

  async function addOrixa(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !ordemPadrao) return;

    const { error } = await supabase
      .from("orixas")
      .insert([{ nome, ordem_padrao: parseInt(ordemPadrao), cor_tema: corTema }]);

    if (error) {
      console.error("Erro ao adicionar:", error);
      alert("Erro ao adicionar Orixá.");
    } else {
      setNome("");
      setOrdemPadrao("");
      fetchOrixas();
    }
  }

  async function deleteOrixa(id: string) {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    const { error } = await supabase.from("orixas").delete().eq("id", id);
    if (error) {
      console.error("Erro ao deletar:", error);
    } else {
      fetchOrixas();
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Orixás</h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">Adicionar Novo Orixá</h3>
        <form onSubmit={addOrixa} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Nome do Orixá</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border dark:border-gray-600 rounded p-2 bg-transparent"
              placeholder="Ex: Exu"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium mb-1">Ordem</label>
            <input
              type="number"
              value={ordemPadrao}
              onChange={(e) => setOrdemPadrao(e.target.value)}
              className="w-full border dark:border-gray-600 rounded p-2 bg-transparent"
              placeholder="1"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium mb-1">Cor</label>
            <input
              type="color"
              value={corTema}
              onChange={(e) => setCorTema(e.target.value)}
              className="w-full border dark:border-gray-600 rounded p-1 h-[42px] bg-transparent cursor-pointer"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex items-center justify-center h-[42px] w-12"
          >
            <Plus size={20} />
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <th className="p-4">Ordem</th>
              <th className="p-4">Nome</th>
              <th className="p-4">Cor Tema</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orixas.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Nenhum orixá cadastrado.
                </td>
              </tr>
            ) : (
              orixas.map((orixa) => (
                <tr key={orixa.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="p-4">{orixa.ordem_padrao}</td>
                  <td className="p-4 font-medium">{orixa.nome}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: orixa.cor_tema }}></div>
                      <span className="text-sm">{orixa.cor_tema}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => deleteOrixa(orixa.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
