import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useSupabaseProgramming } from './SupabaseProgrammingContext';

interface RadioPlayerContextType {
  isPlaying: boolean;
  volume: number;
  currentShow: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  togglePlayPause: () => void;
  handleVolumeChange: (volume: number) => void;
}

export const RadioPlayerContext = createContext<RadioPlayerContextType | undefined>(undefined);

export const RadioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { radioStreamUrl } = useSupabaseProgramming();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [currentShow, setCurrentShow] = useState("RRN");
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
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
      audioRef.current.load(); // Força reload da fonte
      
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
      audioRef.current.preload = 'none'; // Não precarregar para streams ao vivo
      
      // Para streams ao vivo, não autoplay para evitar problemas do browser
      console.log('Stream configurado:', radioStreamUrl);
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
        audioRef,
        togglePlayPause,
        handleVolumeChange,
      }}
    >
      {children}
      {/* Audio element global */}
      <audio 
        ref={audioRef}
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
        }}
        onLoadStart={() => {
          console.log('Carregando stream...');
        }}
        onCanPlay={() => {
          console.log('Stream pronto para reproduzir');
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