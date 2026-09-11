"use client";

import { useEffect, useState, useRef, use } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, FastForward, Rewind, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

type Orixa = { id: string; nome: string; cor_tema: string };
type Cantiga = { id: string; titulo: string; letra: string; ordem: number; orixa_id: string };

type OrixaData = {
  orixa: Orixa;
  cantigas: Cantiga[];
};

export default function PlayerPage({ params }: { params: Promise<{ festaId: string }> }) {
  const { festaId } = use(params);

  const [orixasData, setOrixasData] = useState<OrixaData[]>([]);
  const [loading, setLoading] = useState(true);

  // States de navegação
  const [currentOrixaIndex, setCurrentOrixaIndex] = useState(0);
  const [view, setView] = useState<'TOQUES' | 'CANTIGAS'>('TOQUES');
  const [selectedToque, setSelectedToque] = useState<string | null>(null);
  const [currentCantigaIndex, setCurrentCantigaIndex] = useState(0);
  
  // Toques concluídos: { [orixa_id]: ['Vassi', 'Ijesa'] }
  const [completedToques, setCompletedToques] = useState<Record<string, string[]>>({});

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
      try {
        if (!navigator.onLine) throw new Error("Offline");

        const { data: festaOrixas, error: errOrixas } = await supabase
          .from("festa_orixas")
          .select("orixa_id, ordem_apresentacao, orixas(id, nome, cor_tema)")
          .eq("festa_id", festaId)
          .order("ordem_apresentacao", { ascending: true });

        if (errOrixas) throw errOrixas;

        if (!festaOrixas || festaOrixas.length === 0) {
          setLoading(false);
          return;
        }

        const orixaIds = festaOrixas.map(fo => fo.orixa_id);
        const { data: cantigas, error: errCantigas } = await supabase
          .from("cantigas")
          .select("*")
          .in("orixa_id", orixaIds)
          .order("ordem", { ascending: true });
        
        if (errCantigas) throw errCantigas;

        const { data: festaCantigas, error: errFestaCantigas } = await supabase
          .from("festa_cantigas")
          .select("cantiga_id")
          .eq("festa_id", festaId);
          
        if (errFestaCantigas) throw errFestaCantigas;

        const cantigasFiltradas = festaCantigas && festaCantigas.length > 0
          ? cantigas?.filter(c => festaCantigas.some(fc => fc.cantiga_id === c.id))
          : cantigas;

        if (cantigasFiltradas) {
          let orixasArr: OrixaData[] = [];
          festaOrixas.forEach(fo => {
            const orixaObj = fo.orixas as unknown as Orixa;
            const cantigasDesteOrixa = cantigasFiltradas.filter(c => c.orixa_id === fo.orixa_id);
            if (cantigasDesteOrixa.length > 0) {
              orixasArr.push({ orixa: orixaObj, cantigas: cantigasDesteOrixa });
            }
          });
          setOrixasData(orixasArr);
          localStorage.setItem(`festa_offline_v2_${festaId}`, JSON.stringify(orixasArr));
        }
      } catch (err) {
        console.error("Network falhou, carregando cache offline", err);
        const cached = localStorage.getItem(`festa_offline_v2_${festaId}`);
        if (cached) {
          setOrixasData(JSON.parse(cached));
        }
      }
      setLoading(false);
    }
    loadPlaylist();
  }, [festaId]);

  // Deriva o orixá atual e seus toques disponíveis
  const activeOrixaData = orixasData[currentOrixaIndex];
  const toquesDisponiveis = activeOrixaData 
    ? Array.from(new Set(activeOrixaData.cantigas.map(c => c.titulo || 'Sem Toque')))
    : [];

  const activeCantigas = activeOrixaData && selectedToque
    ? activeOrixaData.cantigas.filter(c => (c.titulo || 'Sem Toque') === selectedToque)
    : [];

  // Ações de Navegação
  const finishToque = () => {
    if (!activeOrixaData || !selectedToque) return;
    
    setCompletedToques(prev => {
      const orixaId = activeOrixaData.orixa.id;
      const alreadyCompleted = prev[orixaId] || [];
      if (!alreadyCompleted.includes(selectedToque)) {
        return { ...prev, [orixaId]: [...alreadyCompleted, selectedToque] };
      }
      return prev;
    });

    setView('TOQUES');
    setSelectedToque(null);
    setCurrentCantigaIndex(0);
  };

  const nextCantiga = () => {
    if (view === 'CANTIGAS') {
      if (currentCantigaIndex < activeCantigas.length - 1) {
        setCurrentCantigaIndex(i => i + 1);
      } else {
        finishToque();
      }
    }
  };

  const prevCantiga = () => {
    if (view === 'CANTIGAS' && currentCantigaIndex > 0) {
      setCurrentCantigaIndex(i => i - 1);
    }
  };

  const skipToque = () => {
    if (view === 'CANTIGAS') {
      finishToque();
    }
  };

  const prevOrixa = () => {
    if (currentOrixaIndex > 0) {
      setCurrentOrixaIndex(i => i - 1);
      setView('TOQUES');
      setSelectedToque(null);
      setCurrentCantigaIndex(0);
    }
  };

  const skipOrixa = () => {
    if (currentOrixaIndex < orixasData.length - 1) {
      setCurrentOrixaIndex(i => i + 1);
      setView('TOQUES');
      setSelectedToque(null);
      setCurrentCantigaIndex(0);
    } else {
      // Fim da festa
      setCurrentOrixaIndex(orixasData.length);
    }
  };

  const startToque = (toque: string) => {
    setSelectedToque(toque);
    setCurrentCantigaIndex(0);
    setView('CANTIGAS');
  };

  // Media Session API
  useEffect(() => {
    if (view === 'CANTIGAS' && activeCantigas.length > 0 && 'mediaSession' in navigator) {
      const current = activeCantigas[currentCantigaIndex];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${current.titulo || 'Toque'} - ${currentCantigaIndex + 1}`,
        artist: activeOrixaData.orixa.nome,
        album: "Ijọba Cantigas",
        artwork: [
          { src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => nextCantiga());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevCantiga());
    }
  }, [view, currentCantigaIndex, activeCantigas, activeOrixaData]);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startSession = () => {
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play falhou:", e));
    }
  };

  // Swipe Support
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (view === 'CANTIGAS') {
      if (touchStartX.current - touchEndX.current > 50) nextCantiga(); // Swipe Left
      if (touchStartX.current - touchEndX.current < -50) prevCantiga(); // Swipe Right
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center dark:bg-black dark:text-white">Carregando Xiré...</div>;
  if (orixasData.length === 0) return (
    <div className="flex flex-col h-screen items-center justify-center p-6 text-center dark:bg-black dark:text-white">
      <p className="mb-4">Nenhuma cantiga encontrada para esta festa.</p>
      <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded">Voltar</Link>
    </div>
  );

  // Tela de Fim de Festa
  if (currentOrixaIndex >= orixasData.length) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-white dark:bg-black dark:text-white">
        <h2 className="text-3xl font-bold mb-4">Fim da Festa!</h2>
        <p className="text-gray-500 mb-8">Todas as cantigas foram cantadas.</p>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold">Voltar ao Início</Link>
      </div>
    );
  }

  const silentAudioSrc = "/silence.mp3";

  return (
    <div 
      className="flex flex-col h-screen bg-white dark:bg-black text-black dark:text-white overflow-hidden select-none relative"
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
        style={{ borderBottomColor: activeOrixaData.orixa.cor_tema, borderBottomWidth: '4px' }}
      >
        <Link href="/" className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
          <ArrowLeft size={24} />
        </Link>
        <div className="text-center flex-1">
          <h1 className="text-xl font-bold uppercase tracking-widest dark:!text-yellow-400" style={{ color: activeOrixaData.orixa.cor_tema }}>
            {activeOrixaData.orixa.nome}
          </h1>
          {view === 'CANTIGAS' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cantiga {currentCantigaIndex + 1} de {activeCantigas.length}
            </p>
          )}
        </div>
        <ThemeToggle />
      </div>

      {view === 'TOQUES' ? (
        // FASE A: Seleção de Toques
        <div className="flex-1 flex flex-col items-center p-6 overflow-y-auto w-full">
          <h2 className="text-2xl font-bold mb-8 mt-4 dark:text-yellow-400">Qual será o toque?</h2>
          
          <div className="flex flex-col gap-4 w-full max-w-md">
            {toquesDisponiveis.map(toque => {
              const isCompleted = completedToques[activeOrixaData.orixa.id]?.includes(toque);
              return (
                <button
                  key={toque}
                  onClick={() => startToque(toque)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isCompleted 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                      : 'border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                  }`}
                >
                  <span className="text-xl font-bold">{toque}</span>
                  {isCompleted && <CheckCircle className="text-green-500" size={24} />}
                </button>
              );
            })}
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 w-full">
            <button 
              onClick={prevOrixa}
              disabled={currentOrixaIndex === 0}
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 p-4 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Rewind size={24} /> <span className="text-sm font-medium">Voltar Orixá</span>
            </button>

            <button 
              onClick={skipOrixa}
              className="flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 p-4"
            >
              <FastForward size={24} /> <span className="text-sm font-medium">Pular Orixá</span>
            </button>
          </div>
        </div>
      ) : (
        // FASE B: Cantando Toque Específico
        <>
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-1">
            <div className="bg-blue-600 h-1 transition-all duration-300" style={{ width: `${((currentCantigaIndex + 1) / activeCantigas.length) * 100}%` }}></div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-500 dark:text-yellow-400">
              {selectedToque}
            </h2>
            <div className="text-3xl md:text-5xl lg:text-6xl font-black text-center leading-relaxed whitespace-pre-wrap">
              {activeCantigas[currentCantigaIndex]?.letra}
            </div>
          </div>

          {/* Player Controls */}
          <div className="h-32 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex flex-col items-center justify-center px-4 pb-4">
            <div className="flex items-center justify-center gap-4 md:gap-8 w-full max-w-md mb-2">
              <button 
                onClick={prevCantiga}
                disabled={currentCantigaIndex === 0}
                className="p-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={40} />
              </button>
              
              <button 
                onClick={nextCantiga}
                className="p-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex-1 md:flex-none flex justify-center"
              >
                <ChevronRight size={48} />
              </button>

              <button 
                onClick={skipToque}
                className="p-4 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 flex flex-col items-center justify-center"
                title="Pular Toque"
              >
                <FastForward size={28} />
              </button>
            </div>
            <span className="text-xs text-gray-400">Próxima Cantiga (Avanço) / Fim do Toque (Fast Forward)</span>
          </div>
        </>
      )}
    </div>
  );
}
