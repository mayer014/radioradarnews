import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useSupabaseProgramming } from './SupabaseProgrammingContext';

interface RadioPlayerContextType {
  isPlaying: boolean;
  volume: number;
  currentShow: string;
  isMuted: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  togglePlayPause: () => void;
  handleVolumeChange: (volume: number) => void;
  unmuteAndPlay: () => Promise<void>;
}

export const RadioPlayerContext = createContext<RadioPlayerContextType | undefined>(undefined);

export const RadioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { radioStreamUrl, streamConfigVersion } = useSupabaseProgramming();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [currentShow, setCurrentShow] = useState("RRN");
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayAttempted, setAutoplayAttempted] = useState(false);
  const [lastWorkingUrl, setLastWorkingUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      // Se estava mutado e agora tem volume, desmutar
      if (isMuted && newVolume > 0) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  const attemptAutoplay = async () => {
    if (!radioStreamUrl || !audioRef.current || autoplayAttempted) {
      console.warn('[RADIO DEBUG] Autoplay não iniciado:', { 
        radioStreamUrl, 
        hasAudioRef: !!audioRef.current, 
        autoplayAttempted 
      });
      return;
    }

    setAutoplayAttempted(true);
    console.log('[RADIO DEBUG] Iniciando autoplay. URL:', radioStreamUrl);

    try {
      // Primeiro tenta autoplay normal com áudio
      audioRef.current.muted = false;
      await audioRef.current.play();
      setIsPlaying(true);
      setIsMuted(false);
      console.log('[RADIO DEBUG] ✓ Autoplay com áudio funcionou!');
    } catch (error) {
      console.warn('[RADIO DEBUG] Autoplay com áudio bloqueado:', (error as any)?.message || error);
      
      try {
        // Se falhar, tenta autoplay mutado
        audioRef.current.muted = true;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsMuted(true);
        console.log('[RADIO DEBUG] ✓ Autoplay mutado funcionou! Usuário precisa ativar o áudio.');
      } catch (mutedError: any) {
        console.error('[RADIO DEBUG] ✗ Autoplay completamente bloqueado:', mutedError?.message || mutedError);
        setIsPlaying(false);
        setIsMuted(false);
      }
    }
  };

  const unmuteAndPlay = async () => {
    if (!audioRef.current) return;

    try {
      audioRef.current.muted = false;
      setIsMuted(false);
      
      if (!isPlaying) {
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
      }
      
      console.log('Áudio ativado pelo usuário');
    } catch (error) {
      console.error('Erro ao ativar áudio:', error);
    }
  };

  const togglePlayPause = () => {
    if (!radioStreamUrl) {
      console.error('[RADIO DEBUG] ✗ Stream da rádio não configurado');
      alert('Stream da rádio não configurado. Configure no painel admin.');
      return;
    }

    if (!audioRef.current) {
      console.error('[RADIO DEBUG] ✗ AudioRef não disponível');
      return;
    }

    console.log('[RADIO DEBUG] Status atual:', { 
      isPlaying, 
      isMuted, 
      currentSrc: audioRef.current.src,
      radioStreamUrl 
    });

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log('[RADIO DEBUG] ✓ Rádio pausada');
    } else {
      console.log('[RADIO DEBUG] Tentando reproduzir stream (manual):', radioStreamUrl);
      
      // Forçar src e recarregar para garantir conexão imediata
      audioRef.current.src = radioStreamUrl;
      audioRef.current.preload = 'auto';
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.load();
      
      // Se estava mutado, desmuta ao dar play manual
      if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
      
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        console.log('[RADIO DEBUG] ✓ Rádio reproduzindo com sucesso (stream ao vivo)');
      }).catch((error: any) => {
        console.error('[RADIO DEBUG] ✗ Erro ao reproduzir:', {
          error: (error?.message) || error,
          name: error?.name,
          code: (error as any)?.code || 'N/A',
          src: audioRef.current?.src,
          networkState: audioRef.current?.networkState,
          readyState: audioRef.current?.readyState
        });
        setIsPlaying(false);
        alert(`Erro ao conectar com o stream da rádio: ${(error?.message) || error}. Verifique a configuração no painel admin.`);
      });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !radioStreamUrl) {
      console.warn('[RADIO DEBUG] Stream não configurado:', {
        hasAudioRef: !!audioRef.current,
        radioStreamUrl
      });
      return;
    }

    // Helpers de normalização e geração de candidatos
    const normalize = (u: string) => {
      if (!u) return '';
      let out = u.trim();
      if (out.startsWith('ttps://') || out.startsWith('ttp://')) out = 'h' + out;
      return out;
    };

    const withSemicolonPath = (path: string) => {
      const clean = path.replace(/\/+$/, '');
      return clean.endsWith(';') ? clean : `${clean};`;
    };

    const appendSemicolonToUrl = (u: string) => {
      try {
        const urlObj = new URL(u);
        const p = urlObj.pathname;
        if (p.endsWith('/;')) return u;
        urlObj.pathname = p.endsWith('/') ? `${p};` : `${p}/;`;
        return urlObj.toString();
      } catch {
        // Caso seja caminho relativo ou URL inválida, tenta aproximação
        if (u.startsWith('/')) return withSemicolonPath(u);
        if (u.endsWith('/;') || u.endsWith(';')) return u;
        return u.endsWith('/') ? `${u};` : `${u}/;`;
      }
    };

    const base = normalize(radioStreamUrl);
    const origin = window.location.origin;
    const isHttps = window.location.protocol === 'https:';

    const candidates: string[] = (() => {
      const list: string[] = [];
      
      // Prioriza URL que funcionou anteriormente
      const storedWorking = localStorage.getItem('rrn_last_working_url');
      if (storedWorking && storedWorking !== base) {
        list.push(storedWorking);
      }
      
      if (base.startsWith('/')) {
        // Caminho relativo: tenta com e sem ';'
        list.push(`${origin}${withSemicolonPath(base)}`);
        list.push(`${origin}${base}`);
      } else {
        // URL absoluta: tenta versão com '/;' (Shoutcast/Icecast), depois a URL crua
        list.push(appendSemicolonToUrl(base));
        list.push(base);
        // Em produção (https), também tenta o proxy caso exista no servidor
        if (isHttps) {
          list.push(`${origin}/radio;`);
          list.push(`${origin}/radio`);
        }
      }
      // Remover duplicatas preservando ordem
      return Array.from(new Set(list));
    })();

    console.log('[RADIO DEBUG] Candidatos de stream:', candidates);

    let stopped = false;
    let idx = 0;

    const tryNext = (reason: string) => {
      if (stopped) return;
      console.warn('[RADIO DEBUG] Falha no candidato', { reason, url: candidates[idx] });
      idx++;
      if (idx >= candidates.length) {
        console.error('[RADIO DEBUG] Todos os candidatos falharam');
        setIsPlaying(false);
        return;
      }
      playIdx();
    };

    const playIdx = () => {
      const url = candidates[idx];
      console.log(`[RADIO DEBUG] Tentando [${idx + 1}/${candidates.length}]`, url);
      audio.src = url;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.volume = volume;

      // Reset para permitir tentativa de autoplay (com fallback mutado)
      setAutoplayAttempted(false);

      const timeoutId = window.setTimeout(() => tryNext('timeout'), 4000);

      const onPlaying = () => {
        clearTimeout(timeoutId);
        setIsPlaying(true);
        setLastWorkingUrl(url);
        localStorage.setItem('rrn_last_working_url', url);
        console.log('[RADIO DEBUG] ✓ Reproduzindo', url);
      };

      const onError = () => {
        clearTimeout(timeoutId);
        tryNext('error');
      };

      audio.addEventListener('playing', onPlaying, { once: true });
      audio.addEventListener('error', onError, { once: true });

      // Dispara tentativa de autoplay com fallback mutado
      attemptAutoplay();
    };

    playIdx();

    // Add visibility change listener for resilient retry
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && audioRef.current?.paused) {
        console.log('[RADIO DEBUG] Resumindo após visibilidade...');
        audioRef.current.play().catch(console.warn);
      }
    };

    const handleOnline = () => {
      if (isPlaying && audioRef.current?.paused) {
        console.log('[RADIO DEBUG] Reconectando após online...');
        audioRef.current.load();
        audioRef.current.play().catch(console.warn);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [radioStreamUrl, streamConfigVersion]);

  // Update volume when it changes - separado para não interferir no stream
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <RadioPlayerContext.Provider
      value={{
        isPlaying,
        volume,
        currentShow,
        isMuted,
        audioRef,
        togglePlayPause,
        handleVolumeChange,
        unmuteAndPlay,
      }}
    >
      {children}
      {/* Audio element global */}
      <audio 
        ref={audioRef}
        playsInline
        preload="auto"
        onEnded={() => {
          console.log('Stream ended, tentando reconectar...');
          setIsPlaying(false);
          // Para streams ao vivo, tentar reconectar automaticamente após um breve delay
          setTimeout(() => {
            if (radioStreamUrl && audioRef.current) {
              audioRef.current.load();
            }
          }, 1000);
        }}
        onError={(e) => {
          setIsPlaying(false);
          console.error('Erro no stream de áudio:', e);
          // Try to reconnect after error using the last working URL
          setTimeout(() => {
            if (audioRef.current) {
              const retryUrl = lastWorkingUrl || radioStreamUrl;
              if (retryUrl) {
                console.log('Tentando reconectar com:', retryUrl);
                audioRef.current.src = retryUrl;
                audioRef.current.load();
                audioRef.current.play().catch(err => console.log('Reconnect failed:', err));
              }
            }
          }, 2000);
        }}
        onLoadStart={() => {
          console.log('Carregando stream...');
        }}
        onCanPlay={() => {
          console.log('Stream pronto para reproduzir');
        }}
        onWaiting={() => {
          console.log('Stream buffering...');
        }}
        onPlaying={() => {
          console.log('Stream playing successfully');
        }}
      />
    </RadioPlayerContext.Provider>
  );
};

export const useMaybeRadioPlayer = () => {
  return useContext(RadioPlayerContext);
};

export const useRadioPlayer = () => {
  const context = useContext(RadioPlayerContext);
  if (!context) {
    throw new Error('useRadioPlayer must be used within a RadioPlayerProvider');
  }
  return context;
};