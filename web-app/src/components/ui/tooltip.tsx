import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  contentClassName?: string;
  delay?: number;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  className,
  contentClassName,
  delay = 300,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showTooltip = (event?: MouseEvent) => {
    if (disabled || !content) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      // Si nous avons un événement de souris, utilisons la position du curseur
      if (event) {
        const tooltipWidth = 320;
        const tooltipHeight = 80;
        const offset = 10;
        
        let x = event.clientX + offset;
        let y = event.clientY - tooltipHeight - offset;
        
        // Ajustements pour rester dans la fenêtre visible
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Ajustement horizontal
        if (x + tooltipWidth > windowWidth - 10) {
          x = event.clientX - tooltipWidth - offset;
        }
        if (x < 10) {
          x = 10;
        }
        
        // Ajustement vertical
        if (y < 10) {
          y = event.clientY + offset;
        }
        if (y + tooltipHeight > windowHeight - 10) {
          y = windowHeight - tooltipHeight - 10;
        }
        
        setTooltipPosition({ x, y });
      } else if (triggerRef.current) {
        // Fallback à l'ancienne méthode si pas d'événement souris
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 80;
        
        let x = rect.left + rect.width / 2 - tooltipWidth / 2;
        let y = rect.top - tooltipHeight - 8;
        
        // Ajustements pour rester dans la fenêtre visible
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (x < 10) x = 10;
        if (x + tooltipWidth > windowWidth - 10) x = windowWidth - tooltipWidth - 10;
        if (y < 10) y = rect.bottom + 8;
        
        setTooltipPosition({ x, y });
      }
      
      setIsVisible(true);
    }, delay);
  };  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionClasses = () => {
    // Ne pas utiliser de transform car nous calculons déjà la position exacte
    return '';
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-700';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900 dark:border-b-gray-700';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900 dark:border-l-gray-700';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900 dark:border-r-gray-700';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-700';
    }
  };

  const tooltipElement = isVisible && content ? (
    <div
      className={cn(
        'fixed z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none max-w-xs break-words',
        getPositionClasses(),
        contentClassName
      )}
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
      }}
    >
      {content}
      <div
        className={cn(
          'absolute w-0 h-0 border-4',
          getArrowClasses()
        )}
      />
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-block', className)}
        onMouseEnter={(e) => showTooltip(e.nativeEvent)}
        onMouseLeave={hideTooltip}
        onFocus={() => showTooltip()}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {typeof document !== 'undefined' && tooltipElement && 
        createPortal(tooltipElement, document.body)
      }
    </>
  );
};