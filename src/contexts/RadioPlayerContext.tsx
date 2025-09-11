import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useProgramming } from './ProgrammingContext';

interface RadioPlayerContextType {
  isPlaying: boolean;
  volume: number;
  currentShow: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  togglePlayPause: () => void;
  handleVolumeChange: (volume: number) => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextType | undefined>(undefined);

export const RadioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { radioStreamUrl } = useProgramming();
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
      audioRef.current.play().catch((error) => {
        console.error('Erro ao reproduzir:', error);
        setIsPlaying(false);
        alert('Erro ao conectar com o stream da rádio. Verifique a URL no painel admin.');
      });
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (audioRef.current && radioStreamUrl) {
      audioRef.current.src = radioStreamUrl;
      audioRef.current.volume = volume;
      
      // Don't auto play to avoid browser blocking issues
      // User needs to manually start the stream
    }
  }, [radioStreamUrl, volume]);

  // Update volume when it changes
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
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          console.error('Erro no stream de áudio');
        }}
      />
    </RadioPlayerContext.Provider>
  );
};

export const useRadioPlayer = () => {
  const context = useContext(RadioPlayerContext);
  if (!context) {
    throw new Error('useRadioPlayer must be used within a RadioPlayerProvider');
  }
  return context;
};