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
  const { radioStreamUrl } = useSupabaseProgramming();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [currentShow, setCurrentShow] = useState("RRN");
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayAttempted, setAutoplayAttempted] = useState(false);
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
      return;
    }

    setAutoplayAttempted(true);
    console.log('Tentando autoplay da rádio...');

    try {
      // Primeiro tenta autoplay normal com áudio
      audioRef.current.muted = false;
      await audioRef.current.play();
      setIsPlaying(true);
      setIsMuted(false);
      console.log('Autoplay com áudio funcionou!');
    } catch (error) {
      console.log('Autoplay com áudio bloqueado, tentando autoplay mutado...');
      
      try {
        // Se falhar, tenta autoplay mutado
        audioRef.current.muted = true;
        await audioRef.current.play();
        setIsPlaying(true);
        setIsMuted(true);
        console.log('Autoplay mutado funcionou! Usuário precisa ativar o áudio.');
      } catch (mutedError) {
        console.log('Autoplay completamente bloqueado. Usuário precisa interagir primeiro.');
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
      console.warn('Stream da rádio não configurado');
      alert('Stream da rádio não configurado. Configure no painel admin.');
      return;
    }

    if (!audioRef.current) {
      console.error('AudioRef não disponível');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log('Rádio pausada');
    } else {
      console.log('Tentando reproduzir stream:', radioStreamUrl);
      
      // Para streams ao vivo, sempre recarregar a fonte para garantir áudio atual
      audioRef.current.load();
      
      // Se estava mutado, desmuta ao dar play manual
      if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
      
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        console.log('Rádio reproduzindo com sucesso (stream ao vivo)');
      }).catch((error) => {
        console.error('Erro ao reproduzir:', error);
        setIsPlaying(false);
        alert('Erro ao conectar com o stream da rádio. Verifique a URL no painel admin.');
      });
    }
  };

  useEffect(() => {
    if (audioRef.current && radioStreamUrl) {
      audioRef.current.src = radioStreamUrl;
      audioRef.current.volume = volume;
      audioRef.current.preload = 'none';
      
      console.log('Stream configurado:', radioStreamUrl);
      
      // Tenta autoplay após configurar o stream
      setTimeout(() => {
        attemptAutoplay();
      }, 500); // Pequeno delay para garantir que o elemento está pronto
    }
  }, [radioStreamUrl]);

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
        preload="none"
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
          // Try to reconnect after error
          setTimeout(() => {
            if (radioStreamUrl && audioRef.current && isPlaying) {
              console.log('Tentando reconectar após erro...');
              audioRef.current.load();
              audioRef.current.play().catch(err => console.log('Reconnect failed:', err));
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