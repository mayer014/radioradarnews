import { Component, useCallback, useEffect, useRef, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const loadSurface = async (attempt: number) => {
  // A fresh development URL avoids a failed/empty module being retained after a hot update.
  const path = `${import.meta.env.BASE_URL}src/components/HexagonSurface.tsx?background-attempt=${attempt}-${Date.now()}`;
  const module = import.meta.env.DEV
    ? await import(/* @vite-ignore */ path)
    : await import('./HexagonSurface');
  if (typeof module.default !== 'function') throw new Error('O módulo do fundo ainda não está disponível.');
  return module as { default: ComponentType };
};

interface BackgroundBoundaryProps {
  children: ReactNode;
  resetKey: string;
  onFailure: () => void;
}

class BackgroundBoundary extends Component<BackgroundBoundaryProps, { failed: boolean; resetKey: string }> {
  state = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromProps(props: BackgroundBoundaryProps, state: { resetKey: string }) {
    return props.resetKey !== state.resetKey ? { failed: false, resetKey: props.resetKey } : null;
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('O fundo decorativo foi desativado após uma falha:', error, info.componentStack);
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const BackgroundLayer = () => {
  const { theme } = useTheme();
  const [attempt, setAttempt] = useState(0);
  const [Surface, setSurface] = useState<ComponentType | null>(null);
  const retryTimer = useRef<number>();
  const retry = useCallback(() => {
    setSurface(null);
    if (attempt >= 2 || retryTimer.current !== undefined) return;
    retryTimer.current = window.setTimeout(() => {
      retryTimer.current = undefined;
      setAttempt(value => value + 1);
    }, 750 * (attempt + 1));
  }, [attempt]);

  useEffect(() => {
    let cancelled = false;
    void loadSurface(attempt).then(module => {
      if (!cancelled) setSurface(() => module.default);
    }).catch(error => {
      if (!cancelled) {
        console.warn('Tentando carregar novamente o fundo decorativo:', error);
        retry();
      }
    });
    return () => { cancelled = true; };
  }, [attempt, retry]);

  useEffect(() => {
    // Keep a scheduled retry alive during a theme change.
    setAttempt(value => value >= 2 ? 0 : value);
  }, [theme]);

  useEffect(() => () => window.clearTimeout(retryTimer.current), []);

  return (
    <>
      {/* The base texture is independent of JavaScript loading and WebGL availability. */}
      <div className="geometric-base" aria-hidden="true">
        <div className="geometric-fallback" />
      </div>
      <BackgroundBoundary resetKey={`${theme}:${attempt}`} onFailure={retry}>
        {Surface && <Surface />}
      </BackgroundBoundary>
    </>
  );
};

export default BackgroundLayer;
