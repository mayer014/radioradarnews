import { useEffect, useCallback } from 'react';

// Hook para melhorar acessibilidade
export const useAccessibility = () => {
  // Focus management for keyboard navigation
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // Close any open dialogs or menus
      const openDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
      const openMenus = document.querySelectorAll('[role="menu"][data-state="open"]');
      
      openDialogs.forEach(dialog => {
        const closeButton = dialog.querySelector('[data-close]') as HTMLElement;
        if (closeButton) closeButton.click();
      });
      
      openMenus.forEach(menu => {
        const trigger = document.querySelector(`[aria-controls="${menu.id}"]`) as HTMLElement;
        if (trigger) trigger.click();
      });
    }
  }, []);

  // Skip to main content functionality
  const addSkipToMain = useCallback(() => {
    if (document.getElementById('skip-to-main')) return;

    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-main';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Pular para o conteúdo principal';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:no-underline';
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content') || document.querySelector('main');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    });

    document.body.prepend(skipLink);
  }, []);

  // Announce page changes for screen readers
  const announcePageChange = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  // Focus management for dynamic content
  const manageFocus = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Check color contrast (development helper)
  const checkContrast = useCallback(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // This is a simplified check - in production, use proper contrast checking library
      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        console.log('Element with potential contrast issues:', element, { color, backgroundColor });
      }
    });
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    addSkipToMain();
    
    // Check contrast in development
    if (process.env.NODE_ENV === 'development') {
      checkContrast();
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey, addSkipToMain, checkContrast]);

  return {
    announcePageChange,
    manageFocus
  };
};

// Hook para melhorar navegação por teclado
export const useKeyboardNavigation = () => {
  const handleArrowKeys = useCallback((event: KeyboardEvent, items: NodeListOf<HTMLElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    
    event.preventDefault();
    
    const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLElement);
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
    }
    
    items[newIndex]?.focus();
  }, []);

  const setupKeyboardNavigation = useCallback((containerSelector: string, itemSelector: string) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = container.querySelectorAll(itemSelector) as NodeListOf<HTMLElement>;
      handleArrowKeys(event, items);
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleArrowKeys]);

  return { setupKeyboardNavigation };
};

// Hook para melhorar experiência de loading
export const useLoadingAnnouncement = () => {
  const announceLoadingState = useCallback((isLoading: boolean, content: string = 'conteúdo') => {
    const message = isLoading 
      ? `Carregando ${content}...` 
      : `${content} carregado com sucesso`;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  return { announceLoadingState };
};

export default useAccessibility;