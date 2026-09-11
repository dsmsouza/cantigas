"use client";

import { useEffect, useState, useRef, use } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, FastForward, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

// Tipagens
type Orixa = { id: string; nome: string; cor_tema: string };
type Cantiga = { id: string; titulo: string; letra: string; ordem: number; orixa_id: string };
type PlaylistCantiga = Cantiga & { orixa: Orixa };

export default function PlayerPage({ params }: { params: Promise<{ festaId: string }> }) {
  const { festaId } = use(params);

  const [playlist, setPlaylist] = useState<PlaylistCantiga[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Wake Lock API (Impede a tela de apagar)
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error("Wake Lock error:", err);
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // Busca as cantigas da festa
  useEffect(() => {
    async function loadPlaylist() {
      // 1. Pegar os orixás da festa
      const { data: festaOrixas } = await supabase
        .from("festa_orixas")
        .select("orixa_id, ordem_apresentacao, orixas(id, nome, cor_tema)")
        .eq("festa_id", festaId)
        .order("ordem_apresentacao", { ascending: true });

      if (!festaOrixas || festaOrixas.length === 0) {
        setLoading(false);
        return;
      }

      // 2. Pegar as cantigas dos orixás selecionados
      const orixaIds = festaOrixas.map(fo => fo.orixa_id);
      const { data: cantigas } = await supabase
        .from("cantigas")
        .select("*")
        .in("orixa_id", orixaIds)
        .order("ordem", { ascending: true });

      // 2.5 Pegar a seleção exata de cantigas dessa festa
      const { data: festaCantigas } = await supabase
        .from("festa_cantigas")
        .select("cantiga_id")
        .eq("festa_id", festaId);

      // Filtra as cantigas baseando-se nas selecionadas (se existir a tabela/dados)
      const cantigasFiltradas = festaCantigas && festaCantigas.length > 0
        ? cantigas?.filter(c => festaCantigas.some(fc => fc.cantiga_id === c.id))
        : cantigas;

      if (cantigasFiltradas) {
        // 3. Montar a playlist ordenada: primeiro por ordem do orixa na festa, depois por ordem da cantiga
        let finalPlaylist: PlaylistCantiga[] = [];
        festaOrixas.forEach(fo => {
          const orixaObj = fo.orixas as unknown as Orixa;
          const cantigasDesteOrixa = cantigasFiltradas.filter(c => c.orixa_id === fo.orixa_id);
          
          cantigasDesteOrixa.forEach(c => {
            finalPlaylist.push({ ...c, orixa: orixaObj });
          });
        });
        setPlaylist(finalPlaylist);
      }
      setLoading(false);
    }
    loadPlaylist();
  }, [festaId]);

  // Controles de Navegação
  const nextCantiga = () => {
    setCurrentIndex(prev => {
      const next = prev < playlist.length - 1 ? prev + 1 : prev;
      return next;
    });
  };

  const prevCantiga = () => {
    setCurrentIndex(prev => {
      const before = prev > 0 ? prev - 1 : prev;
      return before;
    });
  };

  const skipOrixa = () => {
    const currentOrixaId = playlist[currentIndex].orixa_id;
    const nextOrixaIndex = playlist.findIndex((c, i) => i > currentIndex && c.orixa_id !== currentOrixaId);
    if (nextOrixaIndex !== -1) {
      setCurrentIndex(nextOrixaIndex);
    } else {
      setCurrentIndex(playlist.length - 1);
    }
  };

  // Media Session API (Para controle na tela de bloqueio)
  useEffect(() => {
    if (playlist.length > 0 && 'mediaSession' in navigator) {
      const current = playlist[currentIndex];
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.titulo || `Cantiga ${currentIndex + 1}`,
        artist: current.orixa.nome,
        album: "Ijọba Cantigas",
        // Ícone padrão para aparecer no player do celular
        artwork: [
          { src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => nextCantiga());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevCantiga());
    }
  }, [currentIndex, playlist]);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Iniciar a sessão de mídia ativando o áudio silencioso
  const startSession = () => {
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play falhou:", e));
    }
  };

  // Suporte a Swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) nextCantiga(); // Swipe Left (Próxima)
    if (touchStartX.current - touchEndX.current < -50) prevCantiga(); // Swipe Right (Anterior)
  };

  if (loading) return <div className="flex h-screen items-center justify-center dark:bg-gray-900 dark:text-white">Carregando Xiré...</div>;
  if (playlist.length === 0) return (
    <div className="flex flex-col h-screen items-center justify-center p-6 text-center dark:bg-gray-900 dark:text-white">
      <p className="mb-4">Nenhuma cantiga encontrada para esta festa.</p>
      <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded">Voltar</Link>
    </div>
  );

  const current = playlist[currentIndex];
  const progress = ((currentIndex + 1) / playlist.length) * 100;

  // Base64 de um áudio em silêncio de 1 segundo (necessário para o celular manter o widget ativo na tela de bloqueio)
  const silentAudioSrc = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIwBRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjYwAAAAAAAAAAAAAAAAAAAAAAAD/zhAAAYcAAIMAAAAgQAAADBEP//OEABGSAAgwAAACBAAAAMERAA==";

  return (
    <div 
      className="flex flex-col h-screen bg-white dark:bg-gray-900 text-black dark:text-white overflow-hidden select-none relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <audio ref={audioRef} src={silentAudioSrc} loop playsInline />

      {!isPlaying && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Pronto para começar?</h2>
          <p className="text-gray-300 mb-8 max-w-sm">
            O aplicativo tocará um áudio em silêncio contínuo para que você possa avançar as cantigas pelos <b>botões de fone de ouvido</b> ou pela <b>tela de bloqueio</b>.
          </p>
          <button 
            onClick={startSession}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg"
          >
            Iniciar Xiré
          </button>
        </div>
      )}

      {/* Header Fixo */}
      <div 
        className="flex justify-between items-center p-4 border-b dark:border-gray-800"
        style={{ borderBottomColor: current.orixa.cor_tema, borderBottomWidth: '4px' }}
      >
        <Link href="/" className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
          <ArrowLeft size={24} />
        </Link>
        <div className="text-center flex-1">
          <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: current.orixa.cor_tema }}>
            {current.orixa.nome}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cantiga {currentIndex + 1} de {playlist.length}
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1">
        <div className="bg-blue-600 h-1 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Letra da Cantiga (Área principal) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {current.titulo && (
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-500 dark:text-gray-400">
            {current.titulo}
          </h2>
        )}
        <div className="text-3xl md:text-5xl lg:text-6xl font-black text-center leading-relaxed whitespace-pre-wrap">
          {current.letra}
        </div>
      </div>

      {/* Controles de Rodapé */}
      <div className="p-4 grid grid-cols-3 gap-2 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <button 
          onClick={prevCantiga}
          disabled={currentIndex === 0}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-gray-800 shadow disabled:opacity-50 active:scale-95 transition-transform"
        >
          <ChevronLeft size={32} />
          <span className="text-xs mt-1 font-semibold uppercase">Anterior</span>
        </button>

        <button 
          onClick={skipOrixa}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-gray-800 shadow active:scale-95 transition-transform text-gray-500"
        >
          <FastForward size={24} />
          <span className="text-xs mt-2 font-semibold uppercase">Pular Orixá</span>
        </button>

        <button 
          onClick={nextCantiga}
          disabled={currentIndex === playlist.length - 1}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-600 text-white shadow disabled:opacity-50 active:scale-95 transition-transform"
        >
          <ChevronRight size={32} />
          <span className="text-xs mt-1 font-semibold uppercase">Próxima</span>
        </button>
      </div>
    </div>
  );
}
