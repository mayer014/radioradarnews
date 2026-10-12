import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function InternalLayout({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="min-h-screen">
      <main id="main-content" tabIndex={-1} className={cn('page-container', narrow && 'page-container-narrow')}>
        {children}
      </main>
    </div>
  );
}
