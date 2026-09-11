"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

type Orixa = {
  id: string;
  nome: string;
  ordem_padrao: number;
};

type Cantiga = {
  id: string;
  titulo: string;
  letra: string;
  ordem: number;
  orixa_id: string;
};

type Festa = {
  id: string;
  nome: string;
  data: string;
};

export default function FestasPage() {
  const [orixas, setOrixas] = useState<Orixa[]>([]);
  const [cantigas, setCantigas] = useState<Cantiga[]>([]);
  const [festas, setFestas] = useState<Festa[]>([]);
  
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");
  
  const [selectedOrixas, setSelectedOrixas] = useState<string[]>([]);
  const [selectedCantigas, setSelectedCantigas] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrixas();
    fetchCantigas();
    fetchFestas();
  }, []);

  async function fetchOrixas() {
    const { data } = await supabase.from("orixas").select("id, nome, ordem_padrao").order("ordem_padrao", { ascending: true });
    if (data) setOrixas(data);
  }

  async function fetchCantigas() {
    const { data } = await supabase.from("cantigas").select("*").order("ordem", { ascending: true });
    if (data) setCantigas(data);
  }

  async function fetchFestas() {
    const { data } = await supabase.from("festas").select("*").order("data", { ascending: false });
    if (data) setFestas(data);
  }

  const toggleOrixa = (id: string) => {
    setSelectedOrixas(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        setSelectedCantigas(sc => sc.filter(cid => {
          const c = cantigas.find(x => x.id === cid);
          return c?.orixa_id !== id;
        }));
        return prev.filter(o => o !== id);
      } else {
        const cants = cantigas.filter(c => c.orixa_id === id).map(c => c.id);
        setSelectedCantigas(sc => [...new Set([...sc, ...cants])]);
        return [...prev, id];
      }
    });
  };

  const toggleCantiga = (id: string) => {
    setSelectedCantigas(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  async function startEdit(festa: Festa) {
    setEditingId(festa.id);
    setNome(festa.nome);
    setData(festa.data || "");
    
    const { data: relOrixas } = await supabase.from("festa_orixas").select("orixa_id").eq("festa_id", festa.id);
    if (relOrixas) setSelectedOrixas(relOrixas.map(r => r.orixa_id));

    const { data: relCantigas } = await supabase.from("festa_cantigas").select("cantiga_id").eq("festa_id", festa.id);
    if (relCantigas) setSelectedCantigas(relCantigas.map(r => r.cantiga_id));

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setNome("");
    setData("");
    setSelectedOrixas([]);
    setSelectedCantigas([]);
  }

  async function addFesta(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || selectedOrixas.length === 0) {
      alert("Preencha o nome e selecione pelo menos um Orixá.");
      return;
    }

    let festaId = editingId;

    if (editingId) {
      const { error } = await supabase.from("festas").update({ nome, data: data || null }).eq("id", editingId);
      if (error) { console.error("Erro ao atualizar festa:", error); return; }
      
      await supabase.from("festa_orixas").delete().eq("festa_id", editingId);
      await supabase.from("festa_cantigas").delete().eq("festa_id", editingId);
    } else {
      const { data: festaData, error: festaError } = await supabase
        .from("festas")
        .insert([{ nome, data: data || null }])
        .select()
        .single();
      if (festaError || !festaData) { console.error("Erro ao adicionar festa:", festaError); return; }
      festaId = festaData.id;
    }

    const orixasOrdenados = orixas
      .filter(o => selectedOrixas.includes(o.id))
      .sort((a, b) => a.ordem_padrao - b.ordem_padrao);

    const festaOrixasData = orixasOrdenados.map((o, index) => ({
      festa_id: festaId,
      orixa_id: o.id,
      ordem_apresentacao: index + 1
    }));
    await supabase.from("festa_orixas").insert(festaOrixasData);

    if (selectedCantigas.length > 0) {
      const festaCantigasData = selectedCantigas.map(cid => ({
        festa_id: festaId,
        cantiga_id: cid
      }));
      await supabase.from("festa_cantigas").insert(festaCantigasData);
    }

    cancelEdit();
    fetchFestas();
  }

  async function deleteFesta(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta festa?")) return;
    await supabase.from("festas").delete().eq("id", id);
    fetchFestas();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gerenciar Festas (Setlists)</h2>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? "Editar Festa (Setlist)" : "Criar Nova Festa"}
        </h3>
        
        <form onSubmit={addFesta} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
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
            <div className="w-full md:w-48">
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
            <label className="block text-sm font-medium mb-2">Monte o Setlist da Festa</label>
            <p className="text-sm text-gray-500 mb-4">Selecione os Orixás. Depois, você pode desmarcar as cantigas específicas que não serão tocadas hoje.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orixas.length === 0 ? (
                <div className="col-span-full text-gray-500">Nenhum orixá cadastrado.</div>
              ) : (
                orixas.map(o => (
                  <div key={o.id} className="bg-gray-50 dark:bg-gray-900/50 border dark:border-gray-700 p-4 rounded-lg">
                    <label className="flex items-center space-x-2 cursor-pointer font-bold text-lg mb-2 text-blue-700 dark:text-blue-400">
                      <input
                        type="checkbox"
                        checked={selectedOrixas.includes(o.id)}
                        onChange={() => toggleOrixa(o.id)}
                        className="w-5 h-5 rounded focus:ring-blue-500"
                      />
                      <span>{o.ordem_padrao}. {o.nome}</span>
                    </label>
                    
                    {/* Lista de cantigas (só aparece se o orixá estiver selecionado) */}
                    {selectedOrixas.includes(o.id) && (
                      <div className="ml-7 flex flex-col gap-2 mt-3">
                        {cantigas.filter(c => c.orixa_id === o.id).length === 0 ? (
                          <span className="text-xs text-gray-400">Sem cantigas.</span>
                        ) : (
                          cantigas.filter(c => c.orixa_id === o.id).map(c => (
                            <label key={c.id} className="flex items-start space-x-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
                              <input
                                type="checkbox"
                                checked={selectedCantigas.includes(c.id)}
                                onChange={() => toggleCantiga(c.id)}
                                className="w-4 h-4 mt-0.5 rounded focus:ring-blue-500"
                              />
                              <span className="leading-tight">
                                {c.ordem}. {c.titulo || c.letra.split('\n')[0].substring(0, 30) + '...'}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 mt-4 rounded flex items-center gap-2"
            >
              {editingId ? "Atualizar Festa" : <><Plus size={20} /> Salvar Festa e Setlist</>}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-6 mt-4 rounded"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
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
                        onClick={() => startEdit(festa)}
                        className="text-blue-500 hover:text-blue-700 p-2"
                        title="Editar"
                      >
                        ✏️
                      </button>
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
    </div>
  );
}
