/**
 * Hook for handling mobile keyboard appearance
 * Smoothly scrolls focused input into view and restores position when keyboard closes
 */

import { useEffect, useRef, useCallback } from 'react';

export function useKeyboardScroll() {
  const scrollPositionRef = useRef<number>(0);
  const isKeyboardOpenRef = useRef<boolean>(false);

  const handleFocusIn = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if focused element is an input, textarea, or select
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT'
    ) {
      // Store current scroll position before keyboard opens
      if (!isKeyboardOpenRef.current) {
        scrollPositionRef.current = window.scrollY;
        isKeyboardOpenRef.current = true;
      }

      // Scroll element into view with some padding
      setTimeout(() => {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, []);

  const handleFocusOut = useCallback((e: FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    // Check if focus moved to another input (keyboard stays open)
    if (
      relatedTarget?.tagName === 'INPUT' ||
      relatedTarget?.tagName === 'TEXTAREA' ||
      relatedTarget?.tagName === 'SELECT'
    ) {
      return;
    }

    // Keyboard is closing - restore scroll position
    if (isKeyboardOpenRef.current) {
      isKeyboardOpenRef.current = false;
      
      // Small delay to let keyboard close animation complete
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, []);

  useEffect(() => {
    // Add listeners
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // iOS visual viewport API for better keyboard detection
    if (window.visualViewport) {
      const handleResize = () => {
        // Visual viewport resize indicates keyboard appearance
        const viewportHeight = window.visualViewport!.height;
        const windowHeight = window.innerHeight;
        
        // If viewport is significantly smaller, keyboard is likely open
        if (windowHeight - viewportHeight > 150) {
          document.body.classList.add('keyboard-visible');
        } else {
          document.body.classList.remove('keyboard-visible');
        }
      };

      window.visualViewport.addEventListener('resize', handleResize);
      
      return () => {
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('focusout', handleFocusOut);
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    }

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [handleFocusIn, handleFocusOut]);

  return {
    isKeyboardOpen: isKeyboardOpenRef.current,
  };
}

