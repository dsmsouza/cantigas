"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

type Orixa = {
  id: string;
  nome: string;
};

type Cantiga = {
  id: string;
  orixa_id: string;
  titulo: string;
  letra: string;
  ordem: number;
  orixas?: { nome: string }; // relacionamento
};

export default function CantigasPage() {
  const [orixas, setOrixas] = useState<Orixa[]>([]);
  const [cantigas, setCantigas] = useState<Cantiga[]>([]);
  
  const [orixaId, setOrixaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [letra, setLetra] = useState("");
  const [ordem, setOrdem] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrixas();
    fetchCantigas();
  }, []);

  // Auto-preencher a ordem quando o Orixá mudar ou novas cantigas forem carregadas
  useEffect(() => {
    if (orixaId && !editingId) {
      const cantigasOrixa = cantigas.filter(c => c.orixa_id === orixaId);
      const maxOrdem = cantigasOrixa.reduce((max, c) => Math.max(max, c.ordem), 0);
      setOrdem((maxOrdem + 1).toString());
    }
  }, [orixaId, cantigas, editingId]);

  async function fetchOrixas() {
    const { data } = await supabase.from("orixas").select("id, nome").order("ordem_padrao", { ascending: true });
    if (data) {
      setOrixas(data);
      if (data.length > 0 && !orixaId) setOrixaId(data[0].id);
    }
  }

  async function fetchCantigas() {
    const { data, error } = await supabase
      .from("cantigas")
      .select("*, orixas(nome)")
      .order("ordem", { ascending: true });
    
    if (data) setCantigas(data);
    if (error) console.error("Erro ao buscar cantigas:", error);
  }

  function startEdit(cantiga: Cantiga) {
    setEditingId(cantiga.id);
    setOrixaId(cantiga.orixa_id);
    setTitulo(cantiga.titulo || "");
    setLetra(cantiga.letra);
    setOrdem(cantiga.ordem.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setTitulo("");
    setLetra("");
    // A ordem será recalculada pelo useEffect
  }

  async function addCantiga(e: React.FormEvent) {
    e.preventDefault();
    if (!orixaId || !letra || !ordem) return;

    if (editingId) {
      const { error } = await supabase
        .from("cantigas")
        .update({ orixa_id: orixaId, titulo, letra, ordem: parseInt(ordem) })
        .eq("id", editingId);

      if (error) {
        console.error("Erro ao editar cantiga:", error);
        alert("Erro ao editar cantiga.");
      } else {
        cancelEdit();
        fetchCantigas();
      }
    } else {
      const { error } = await supabase
        .from("cantigas")
        .insert([{ orixa_id: orixaId, titulo, letra, ordem: parseInt(ordem) }]);

      if (error) {
        console.error("Erro ao adicionar cantiga:", error);
        alert("Erro ao adicionar cantiga.");
      } else {
        setTitulo("");
        setLetra("");
        // A ordem será atualizada pelo useEffect
        fetchCantigas();
      }
    }
  }

  async function deleteCantiga(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta cantiga?")) return;
    const { error } = await supabase.from("cantigas").delete().eq("id", id);
    if (!error) fetchCantigas();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Cantigas</h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? "Editar Cantiga" : "Adicionar Nova Cantiga"}
        </h3>
        
        {orixas.length === 0 ? (
          <div className="text-yellow-600 dark:text-yellow-400 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            Você precisa cadastrar um Orixá antes de adicionar uma cantiga.
          </div>
        ) : (
          <form onSubmit={addCantiga} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Orixá</label>
                <select
                  value={orixaId}
                  onChange={(e) => setOrixaId(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded p-2 bg-transparent"
                  required
                >
                  {orixas.map(o => (
                    <option key={o.id} value={o.id} className="dark:bg-gray-800">{o.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Título (Opcional)</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded p-2 bg-transparent"
                  placeholder="Ex: Cantiga de Saída"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium mb-1">Ordem</label>
                <input
                  type="number"
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded p-2 bg-transparent"
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Letra da Cantiga</label>
              <textarea
                value={letra}
                onChange={(e) => setLetra(e.target.value)}
                className="w-full border dark:border-gray-600 rounded p-2 bg-transparent min-h-[120px]"
                placeholder="Cole a letra do PDF aqui..."
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center gap-2"
              >
                {editingId ? "Atualizar Cantiga" : <><Plus size={20} /> Salvar Cantiga</>}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <th className="p-4">Orixá</th>
              <th className="p-4">Ordem</th>
              <th className="p-4">Título / Letra (Resumo)</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cantigas.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Nenhuma cantiga cadastrada.
                </td>
              </tr>
            ) : (
              cantigas.map((cantiga) => (
                <tr key={cantiga.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="p-4 font-medium">{cantiga.orixas?.nome}</td>
                  <td className="p-4">{cantiga.ordem}</td>
                  <td className="p-4">
                    <div className="font-semibold">{cantiga.titulo || "Sem título"}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                      {cantiga.letra.split('\n')[0]}...
                    </div>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => startEdit(cantiga)}
                      className="text-blue-500 hover:text-blue-700 p-2"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteCantiga(cantiga.id)}
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
