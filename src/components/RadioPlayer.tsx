import React, { useState } from 'react';
import { useRadio } from '@/contexts/RadioContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * RadioPlayer Component
 * 
 * Player de rádio fixo e responsivo que aparece no site.
 * Permite ao usuário controlar a reprodução da rádio online.
 * 
 * Funcionalidades:
 * - Play/Pause do stream
 * - Controle de volume
 * - Indicador de status (tocando, carregando, erro)
 * - Design minimalista e elegante
 * - Pode ser minimizado/expandido
 */
const RadioPlayer = () => {
  const { 
    streamUrl, 
    isPlaying, 
    volume, 
    isLoading, 
    error, 
    togglePlay, 
    setVolume 
  } = useRadio();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  // Não renderizar se não houver stream configurado
  if (!streamUrl) {
    return null;
  }

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-gradient-card backdrop-blur-md",
      "border-t border-primary/30",
      "shadow-lg shadow-primary/20",
      "transition-all duration-300 ease-in-out",
      isExpanded ? "translate-y-0" : "translate-y-[calc(100%-3rem)]"
    )}>
      {/* Header - sempre visível */}
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            isPlaying ? "bg-gradient-hero animate-pulse" : "bg-primary/20"
          )}>
            <Radio className={cn(
              "h-4 w-4",
              isPlaying ? "text-white" : "text-primary"
            )} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Rádio Ao Vivo
            </h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Conectando...' : isPlaying ? 'No ar' : 'Parado'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Player Controls - expandível */}
      <div className={cn(
        "px-4 pb-4 space-y-4",
        "transition-all duration-300",
        isExpanded ? "opacity-100 max-h-40" : "opacity-0 max-h-0 overflow-hidden"
      )}>
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Play/Pause Button */}
        <div className="flex items-center justify-center">
          <Button
            onClick={togglePlay}
            disabled={isLoading}
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full",
              isPlaying ? "bg-gradient-hero" : "bg-primary",
              "hover:shadow-glow-primary transition-all duration-300"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1">
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.01}
              className="cursor-pointer"
            />
          </div>

          <span className="text-xs text-muted-foreground w-10 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          {isPlaying && (
            <div className="flex items-center justify-center gap-1">
              <span className="inline-block w-1 h-3 bg-primary animate-pulse" style={{ animationDelay: '0ms' }}></span>
              <span className="inline-block w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: '150ms' }}></span>
              <span className="inline-block w-1 h-3 bg-primary animate-pulse" style={{ animationDelay: '300ms' }}></span>
              <span className="text-xs text-muted-foreground ml-2">Transmitindo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RadioPlayer;
