"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [status, setStatus] = useState("");
  const { login } = useAuth();

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setStatus("A nova senha deve ter pelo menos 4 caracteres.");
      return;
    }
    try {
      setStatus("Atualizando...");
      // Chamada segura via RPC exigindo a senha atual
      const { data, error } = await supabase.rpc('atualizar_pin', { 
        p_pin_atual: currentPin, 
        p_novo_pin: newPin 
      });
        
      if (error) throw error;
      
      if (data === true) {
        // Atualiza a memória local com a nova senha
        await login(newPin);
        setStatus("Senha atualizada com sucesso!");
        setCurrentPin("");
        setNewPin("");
      } else {
        setStatus("Senha atual incorreta!");
      }
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      console.error(error);
      setStatus("Erro ao atualizar senha.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Painel de Gestão</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Utilize o menu lateral para gerenciar os Orixás, Cantigas e as Festas.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md">
        <h3 className="text-lg font-bold mb-4">Alterar Senha do Admin</h3>
        <form onSubmit={handleUpdatePin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Senha Atual</label>
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Digite a senha atual"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Novo PIN / Senha</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Digite a nova senha"
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full">
            Salvar Nova Senha
          </button>
          {status && <p className={`text-sm font-medium mt-2 text-center ${status.includes('sucesso') ? 'text-green-500' : 'text-red-500'}`}>{status}</p>}
        </form>
      </div>
    </div>
  );
}
