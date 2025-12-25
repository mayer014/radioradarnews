import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * RadioContext
 * 
 * Gerencia o estado global do player de rádio online.
 * Controla reprodução, volume, status de conexão e carrega
 * a URL do stream configurada no banco de dados.
 * 
 * Inclui:
 * - Reconexão automática em caso de falha
 * - Media Session API para controle em segundo plano (mobile)
 * - Keep-alive para manter conexão ativa
 * - Tratamento robusto de erros de rede
 */

interface RadioContextType {
  streamUrl: string;
  isPlaying: boolean;
  volume: number;
  isLoading: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  refreshStreamUrl: () => Promise<void>;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

// Configurações de reconexão
const RECONNECT_DELAY_MS = 3000; // 3 segundos entre tentativas
const MAX_RECONNECT_ATTEMPTS = 10; // Máximo de tentativas
const KEEP_ALIVE_INTERVAL_MS = 30000; // Verificar conexão a cada 30 segundos

export const RadioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streamUrl, setStreamUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasPlayingRef = useRef(false);
  const isReconnectingRef = useRef(false);

  // Carregar URL do stream do banco de dados
  const loadStreamUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('category', 'radio')
        .eq('key', 'stream_url')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        const url = typeof data.value === 'string' ? data.value : (data.value as any).url || '';
        setStreamUrl(url);
      }
    } catch (error) {
      console.error('Erro ao carregar URL do stream:', error);
      setError('Não foi possível carregar a configuração da rádio');
    }
  };

  // Função de reconexão robusta
  const attemptReconnect = useCallback(() => {
    if (!audioRef.current || !streamUrl || isReconnectingRef.current) return;
    
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[Radio] Máximo de tentativas de reconexão atingido');
      setError('Conexão perdida. Clique para tentar novamente.');
      reconnectAttemptsRef.current = 0;
      isReconnectingRef.current = false;
      return;
    }

    isReconnectingRef.current = true;
    reconnectAttemptsRef.current += 1;
    
    console.log(`[Radio] Tentativa de reconexão ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);
    setIsLoading(true);
    setError(null);

    // Limpar timeout anterior
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (audioRef.current && wasPlayingRef.current) {
        // Recriar o elemento de áudio para garantir nova conexão
        const currentVolume = audioRef.current.volume;
        audioRef.current.pause();
        audioRef.current.src = '';
        
        // Adicionar timestamp para forçar nova conexão (bypass cache)
        const separator = streamUrl.includes('?') ? '&' : '?';
        const freshUrl = `${streamUrl}${separator}_t=${Date.now()}`;
        audioRef.current.src = freshUrl;
        audioRef.current.volume = currentVolume;
        audioRef.current.load();
        
        audioRef.current.play()
          .then(() => {
            console.log('[Radio] Reconexão bem sucedida');
            reconnectAttemptsRef.current = 0;
            isReconnectingRef.current = false;
            setIsLoading(false);
            setError(null);
          })
          .catch((err) => {
            console.error('[Radio] Falha na reconexão:', err);
            isReconnectingRef.current = false;
            attemptReconnect();
          });
      } else {
        isReconnectingRef.current = false;
      }
    }, RECONNECT_DELAY_MS);
  }, [streamUrl]);

  // Configurar Media Session API para controle em segundo plano
  const setupMediaSession = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Rádio Radar News',
        artist: 'Ao Vivo',
        album: 'Streaming',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        pause();
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        pause();
      });
    }
  }, []);

  // Atualizar estado da Media Session
  const updateMediaSessionState = useCallback((playing: boolean) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }
  }, []);

  // Keep-alive: verificar periodicamente se o stream ainda está ativo
  const startKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
    }

    keepAliveIntervalRef.current = setInterval(() => {
      if (audioRef.current && wasPlayingRef.current) {
        const audio = audioRef.current;
        
        // Verificar se o áudio travou (paused mas deveria estar tocando)
        if (audio.paused && wasPlayingRef.current && !isReconnectingRef.current) {
          console.log('[Radio] Detectado stream parado, reconectando...');
          attemptReconnect();
        }
        
        // Verificar se está em buffering por muito tempo
        if (audio.readyState < 3 && wasPlayingRef.current && !isReconnectingRef.current) {
          console.log('[Radio] Detectado buffering longo, reconectando...');
          attemptReconnect();
        }
      }
    }, KEEP_ALIVE_INTERVAL_MS);
  }, [attemptReconnect]);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  }, []);

  // Inicializar audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.preload = 'none';
    
    // Configurações para melhor compatibilidade mobile
    audioRef.current.setAttribute('playsinline', 'true');
    audioRef.current.setAttribute('webkit-playsinline', 'true');

    const audio = audioRef.current;

    const handlePlay = () => {
      console.log('[Radio] Stream iniciado');
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
      wasPlayingRef.current = true;
      reconnectAttemptsRef.current = 0;
      updateMediaSessionState(true);
      startKeepAlive();
    };

    const handlePause = () => {
      console.log('[Radio] Stream pausado');
      setIsPlaying(false);
      setIsLoading(false);
      updateMediaSessionState(false);
      // Não parar keep-alive aqui para detectar pausas indesejadas
    };

    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      const errorCode = audioElement.error?.code;
      console.error('[Radio] Erro no stream:', errorCode, audioElement.error?.message);
      
      setIsPlaying(false);
      setIsLoading(false);
      
      // Se estava tocando, tentar reconectar
      if (wasPlayingRef.current && !isReconnectingRef.current) {
        console.log('[Radio] Erro detectado, tentando reconectar...');
        attemptReconnect();
      } else {
        setError('Erro ao conectar com a rádio');
      }
    };

    const handleWaiting = () => {
      console.log('[Radio] Buffering...');
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      console.log('[Radio] Pronto para reproduzir');
      setIsLoading(false);
    };

    const handleStalled = () => {
      console.log('[Radio] Stream travado');
      if (wasPlayingRef.current && !isReconnectingRef.current) {
        attemptReconnect();
      }
    };

    const handleEnded = () => {
      console.log('[Radio] Stream finalizado');
      // Streams ao vivo não devem terminar, reconectar
      if (wasPlayingRef.current && !isReconnectingRef.current) {
        attemptReconnect();
      }
    };

    const handleAbort = () => {
      console.log('[Radio] Stream abortado');
      if (wasPlayingRef.current && !isReconnectingRef.current) {
        attemptReconnect();
      }
    };

    const handleSuspend = () => {
      console.log('[Radio] Stream suspenso');
      // Em mobile, o navegador pode suspender o áudio em background
      // Não fazer nada aqui, deixar o keep-alive lidar
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('abort', handleAbort);
    audio.addEventListener('suspend', handleSuspend);

    // Configurar Media Session
    setupMediaSession();

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('abort', handleAbort);
      audio.removeEventListener('suspend', handleSuspend);
      audio.pause();
      stopKeepAlive();
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [attemptReconnect, setupMediaSession, startKeepAlive, stopKeepAlive, updateMediaSessionState]);

  // Reconectar quando a página volta ao foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wasPlayingRef.current) {
        console.log('[Radio] Página voltou ao foco, verificando stream...');
        
        if (audioRef.current) {
          const audio = audioRef.current;
          
          // Se o áudio parou enquanto estava em background, reconectar
          if (audio.paused && !isReconnectingRef.current) {
            console.log('[Radio] Stream parado, reconectando...');
            attemptReconnect();
          }
        }
      }
    };

    const handleOnline = () => {
      console.log('[Radio] Conexão restaurada');
      if (wasPlayingRef.current && audioRef.current?.paused && !isReconnectingRef.current) {
        attemptReconnect();
      }
    };

    const handleOffline = () => {
      console.log('[Radio] Conexão perdida');
      setError('Sem conexão com a internet');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptReconnect]);

  // Carregar stream URL ao montar
  useEffect(() => {
    loadStreamUrl();

    const channel = supabase
      .channel('radio-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings',
          filter: 'category=eq.radio'
        },
        () => {
          loadStreamUrl();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Atualizar src quando streamUrl mudar
  useEffect(() => {
    if (audioRef.current && streamUrl) {
      const wasPlaying = isPlaying;
      if (wasPlaying) {
        audioRef.current.pause();
      }
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      if (wasPlaying) {
        play();
      }
    }
  }, [streamUrl]);

  const play = () => {
    if (!audioRef.current || !streamUrl) {
      setError('Stream não configurado');
      return;
    }

    setIsLoading(true);
    setError(null);
    wasPlayingRef.current = true;
    reconnectAttemptsRef.current = 0;

    // Garantir que o src está definido
    if (!audioRef.current.src || audioRef.current.src === '') {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
    }

    audioRef.current.play().catch((error) => {
      console.error('[Radio] Erro ao reproduzir:', error);
      
      // Em mobile, autoplay pode ser bloqueado
      if (error.name === 'NotAllowedError') {
        setError('Toque para iniciar a rádio');
      } else {
        setError('Não foi possível reproduzir a rádio');
      }
      setIsLoading(false);
      wasPlayingRef.current = false;
    });
  };

  const pause = () => {
    wasPlayingRef.current = false;
    stopKeepAlive();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  };

  const refreshStreamUrl = async () => {
    await loadStreamUrl();
  };

  return (
    <RadioContext.Provider
      value={{
        streamUrl,
        isPlaying,
        volume,
        isLoading,
        error,
        play,
        pause,
        togglePlay,
        setVolume,
        refreshStreamUrl,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};
