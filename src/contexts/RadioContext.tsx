import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * RadioContext
 * 
 * Gerencia o estado global do player de rádio online.
 * Controla reprodução, volume, status de conexão e carrega
 * a URL do stream configurada no banco de dados.
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

export const RadioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streamUrl, setStreamUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7); // 70% volume inicial
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Inicializar audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.preload = 'none';

    // Event listeners
    const audio = audioRef.current;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleError = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setError('Erro ao conectar com a rádio');
      console.error('Erro no stream de áudio');
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
    };
  }, []);

  // Carregar stream URL ao montar
  useEffect(() => {
    loadStreamUrl();

    // Listener para mudanças na tabela settings
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

    audioRef.current.play().catch((error) => {
      console.error('Erro ao reproduzir:', error);
      setError('Não foi possível reproduzir a rádio');
      setIsLoading(false);
    });
  };

  const pause = () => {
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
