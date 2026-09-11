"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

type Orixa = {
  id: string;
  nome: string;
  ordem_padrao: number;
};

type Festa = {
  id: string;
  nome: string;
  data: string;
};

export default function FestasPage() {
  const [orixas, setOrixas] = useState<Orixa[]>([]);
  const [festas, setFestas] = useState<Festa[]>([]);
  
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  const [selectedOrixas, setSelectedOrixas] = useState<string[]>([]);

  useEffect(() => {
    fetchOrixas();
    fetchFestas();
  }, []);

  async function fetchOrixas() {
    const { data } = await supabase.from("orixas").select("id, nome, ordem_padrao").order("ordem_padrao", { ascending: true });
    if (data) setOrixas(data);
  }

  async function fetchFestas() {
    const { data } = await supabase.from("festas").select("*").order("data", { ascending: false });
    if (data) setFestas(data);
  }

  const toggleOrixa = (id: string) => {
    setSelectedOrixas(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  async function addFesta(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || selectedOrixas.length === 0) {
      alert("Preencha o nome e selecione pelo menos um Orixá.");
      return;
    }

    // 1. Criar a festa
    const { data: festaData, error: festaError } = await supabase
      .from("festas")
      .insert([{ nome, data: data || null }])
      .select()
      .single();

    if (festaError || !festaData) {
      console.error("Erro ao adicionar festa:", festaError);
      return;
    }

    // 2. Adicionar os orixás selecionados na ordem padrão deles
    // Ordenar os orixás selecionados baseando-se na ordem_padrao
    const orixasOrdenados = orixas
      .filter(o => selectedOrixas.includes(o.id))
      .sort((a, b) => a.ordem_padrao - b.ordem_padrao);

    const festaOrixasData = orixasOrdenados.map((o, index) => ({
      festa_id: festaData.id,
      orixa_id: o.id,
      ordem_apresentacao: index + 1
    }));

    const { error: relError } = await supabase.from("festa_orixas").insert(festaOrixasData);

    if (relError) {
      console.error("Erro ao vincular orixás:", relError);
    } else {
      setNome("");
      setData("");
      setSelectedOrixas([]);
      fetchFestas();
    }
  }

  async function deleteFesta(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta festa? (Isso também apagará a setlist dela)")) return;
    const { error } = await supabase.from("festas").delete().eq("id", id);
    if (!error) fetchFestas();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Festas (Setlists)</h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">Criar Nova Festa</h3>
        
        <form onSubmit={addFesta} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Nome do Evento</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border dark:border-gray-600 rounded p-2 bg-transparent"
                placeholder="Ex: Saída de Yaô, Toque de Oxóssi..."
                required
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Data (Opcional)</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full border dark:border-gray-600 rounded p-2 bg-transparent dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Selecione os Orixás (Xiré desta festa)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border dark:border-gray-700">
              {orixas.length === 0 ? (
                <div className="col-span-full text-gray-500">Nenhum orixá cadastrado.</div>
              ) : (
                orixas.map(o => (
                  <label key={o.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <input
                      type="checkbox"
                      checked={selectedOrixas.includes(o.id)}
                      onChange={() => toggleOrixa(o.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span>{o.ordem_padrao}. {o.nome}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              A ordem das cantigas na festa seguirá a "Ordem Padrão" configurada no cadastro de Orixás.
            </p>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center gap-2"
          >
            <Plus size={20} /> Salvar Festa
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <th className="p-4">Nome da Festa</th>
              <th className="p-4">Data</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {festas.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  Nenhuma festa cadastrada.
                </td>
              </tr>
            ) : (
              festas.map((festa) => (
                <tr key={festa.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="p-4 font-medium">{festa.nome}</td>
                  <td className="p-4">
                    {festa.data ? new Date(festa.data).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => deleteFesta(festa.id)}
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
