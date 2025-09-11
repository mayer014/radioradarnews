import React from 'react';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Card } from '@/components/ui/card';

interface LoadingStateProps {
  type?: 'page' | 'card' | 'inline' | 'button';
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'page',
  text = 'Carregando...',
  className,
  size = 'md',
  showText = true
}) => {
  if (type === 'button') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)} role="status" aria-label={text}>
        <LoadingSpinner size="sm" />
        {showText && <span className="text-sm">{text}</span>}
        <span className="sr-only">{text}</span>
      </div>
    );
  }

  if (type === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)} role="status" aria-label={text}>
        <LoadingSpinner size={size} />
        {showText && <span>{text}</span>}
        <span className="sr-only">{text}</span>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <Card className={cn('p-8 text-center bg-gradient-card border-primary/20', className)}>
        <div className="flex flex-col items-center gap-4" role="status" aria-label={text}>
          <LoadingSpinner size={size} />
          {showText && (
            <p className="text-muted-foreground" aria-live="polite">
              {text}
            </p>
          )}
          <span className="sr-only">{text}</span>
        </div>
      </Card>
    );
  }

  // type === 'page'
  return (
    <div 
      className={cn(
        'min-h-[400px] flex flex-col items-center justify-center gap-6',
        className
      )}
      role="status"
      aria-label={text}
    >
      <LoadingSpinner size="lg" />
      {showText && (
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold" aria-live="polite">
            {text}
          </h2>
          <p className="text-muted-foreground text-sm">
            Por favor, aguarde enquanto carregamos o conteúdo
          </p>
        </div>
      )}
      <span className="sr-only">{text}</span>
    </div>
  );
};

// Skeleton components for better loading UX
export const ArticleSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" role="status" aria-label="Carregando artigo">
    {/* Header skeleton */}
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="h-6 w-20 bg-muted/50 rounded" />
        <div className="h-4 w-32 bg-muted/30 rounded" />
      </div>
      <div className="h-12 w-full bg-muted/50 rounded" />
      <div className="h-6 w-3/4 bg-muted/30 rounded" />
    </div>
    
    {/* Image skeleton */}
    <div className="h-64 w-full bg-muted/50 rounded-lg" />
    
    {/* Content skeleton */}
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            'h-4 bg-muted/30 rounded',
            i === 2 ? 'w-2/3' : i === 5 ? 'w-3/4' : 'w-full'
          )} 
        />
      ))}
    </div>
    <span className="sr-only">Carregando conteúdo do artigo</span>
  </div>
);

export const NewsGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-label="Carregando notícias">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} className="p-4 space-y-4 animate-pulse bg-gradient-card border-primary/20">
        <div className="h-40 w-full bg-muted/50 rounded" />
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted/30 rounded" />
          <div className="h-6 w-full bg-muted/50 rounded" />
          <div className="h-4 w-3/4 bg-muted/30 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-muted/30 rounded" />
          <div className="h-8 w-20 bg-muted/50 rounded" />
        </div>
      </Card>
    ))}
    <span className="sr-only">Carregando grade de notícias</span>
  </div>
);

export const ColumnistSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" role="status" aria-label="Carregando perfil do colunista">
    {/* Header skeleton */}
    <Card className="p-8 bg-gradient-card border-primary/20">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="w-32 h-32 bg-muted/50 rounded-full" />
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="h-8 w-48 bg-muted/50 rounded mx-auto md:mx-0" />
          <div className="h-6 w-32 bg-muted/30 rounded mx-auto md:mx-0" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted/30 rounded" />
            <div className="h-4 w-3/4 bg-muted/30 rounded mx-auto md:mx-0" />
          </div>
        </div>
      </div>
    </Card>
    
    {/* Articles skeleton */}
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-6 bg-gradient-card border-primary/20">
          <div className="flex gap-6">
            <div className="w-32 h-32 bg-muted/50 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-4">
                <div className="h-4 w-16 bg-muted/30 rounded" />
                <div className="h-4 w-24 bg-muted/30 rounded" />
              </div>
              <div className="h-6 w-full bg-muted/50 rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted/30 rounded" />
                <div className="h-4 w-2/3 bg-muted/30 rounded" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
    <span className="sr-only">Carregando artigos do colunista</span>
  </div>
);

export default LoadingState;