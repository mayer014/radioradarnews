import React, { useState } from 'react';
import { Play, Pause, Volume2, Radio, Music, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMaybeRadioPlayer } from '@/contexts/RadioPlayerContext';
import { useSupabaseProgramming } from '@/contexts/SupabaseProgrammingContext';

const RadioPlayer = () => {
  const player = useMaybeRadioPlayer();
  const { radioStreamUrl } = useSupabaseProgramming();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!player) {
    return null; // Evita erro quando o provider ainda não está montado
  }

  const { isPlaying, volume, togglePlayPause, handleVolumeChange } = player;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      {isMinimized ? (
        // Layout Minimizado - Sem fundo, apenas botões flutuando
        <div className="flex items-center space-x-2 ml-auto mr-4 w-fit">
          <div className="relative">
            <Button
              onClick={togglePlayPause}
              disabled={!radioStreamUrl}
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary-glow shadow-glow-primary transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            {isPlaying && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse">
                <div className="w-full h-full bg-accent rounded-full animate-ping"></div>
              </div>
            )}
          </div>
          
          <Button
            onClick={() => setIsMinimized(false)}
            variant="ghost"
            className="w-8 h-8 rounded-full hover:bg-primary/10 bg-background/80 backdrop-blur-sm border border-primary/20"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        // Layout Completo com fundo
        <div className="bg-gradient-card backdrop-blur-md border border-primary/20 rounded-2xl shadow-neon transition-all duration-300 p-4">
          <div className="flex items-center justify-between">
            {/* Status da Rádio */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center animate-neon-pulse">
                  <Radio className="w-6 h-6 text-white" />
                </div>
                {isPlaying && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse">
                    <div className="w-full h-full bg-accent rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/ef193e05-ec63-47a4-9731-ac6dd613febc.png" 
                  alt="RRN Logo" 
                  className="h-8 object-contain dark:brightness-0 dark:invert"
                />
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={togglePlayPause}
                disabled={!radioStreamUrl}
                className="w-12 h-12 rounded-full bg-primary hover:bg-primary-glow shadow-glow-primary transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <div className="relative w-20 h-2 bg-muted rounded-full cursor-pointer">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div 
                    className="h-full bg-gradient-hero rounded-full transition-all duration-200"
                    style={{ width: `${volume * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <Button
                onClick={() => setIsMinimized(true)}
                variant="ghost"
                className="w-10 h-10 rounded-full hover:bg-primary/10"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Info Adicional */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Music className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">128 kbps</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadioPlayer;