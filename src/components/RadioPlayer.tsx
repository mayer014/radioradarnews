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
      "fixed bottom-4 right-4 z-50",
      "bg-background/95 backdrop-blur-sm",
      "border border-border",
      "rounded-full shadow-lg",
      "transition-all duration-300 ease-in-out",
      isExpanded ? "w-64" : "w-auto"
    )}>
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlay}
          disabled={isLoading}
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 w-8 p-0 rounded-full",
            isPlaying && "bg-primary/10"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        {/* Status Indicator */}
        {isPlaying && (
          <div className="flex items-center gap-0.5">
            <span className="inline-block w-0.5 h-2 bg-primary animate-pulse" style={{ animationDelay: '0ms' }}></span>
            <span className="inline-block w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: '150ms' }}></span>
            <span className="inline-block w-0.5 h-2 bg-primary animate-pulse" style={{ animationDelay: '300ms' }}></span>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <Radio className="h-3 w-3" />
          )}
        </Button>

        {/* Volume Control - só aparece quando expandido */}
        {isExpanded && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>

            <div className="flex-1 min-w-[80px]">
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="cursor-pointer"
              />
            </div>
          </>
        )}

        {/* Error Indicator */}
        {error && (
          <AlertCircle className="h-3 w-3 text-destructive" />
        )}
      </div>
    </div>
  );
};

export default RadioPlayer;
