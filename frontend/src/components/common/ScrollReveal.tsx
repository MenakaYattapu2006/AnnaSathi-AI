import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'fade';
  delay?: number; // in milliseconds
  duration?: number; // in milliseconds
  threshold?: number;
  className?: string;
  cascade?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.12,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once revealed, unobserve to maintain performance and avoid jitter
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentEl = elementRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [threshold]);

  // Transform styles according to animation type
  const getInitialStyle = (): React.CSSProperties => {
    const baseTransition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return {
            opacity: 0,
            transform: 'translateY(36px)',
            transition: baseTransition,
            willChange: 'opacity, transform',
          };
        case 'fade-down':
          return {
            opacity: 0,
            transform: 'translateY(-36px)',
            transition: baseTransition,
            willChange: 'opacity, transform',
          };
        case 'fade-left':
          return {
            opacity: 0,
            transform: 'translateX(40px)',
            transition: baseTransition,
            willChange: 'opacity, transform',
          };
        case 'fade-right':
          return {
            opacity: 0,
            transform: 'translateX(-40px)',
            transition: baseTransition,
            willChange: 'opacity, transform',
          };
        case 'zoom-in':
          return {
            opacity: 0,
            transform: 'scale(0.94)',
            transition: baseTransition,
            willChange: 'opacity, transform',
          };
        case 'fade':
        default:
          return {
            opacity: 0,
            transition: baseTransition,
            willChange: 'opacity',
          };
      }
    }

    return {
      opacity: 1,
      transform: 'none',
      transition: baseTransition,
    };
  };

  return (
    <div ref={elementRef} style={getInitialStyle()} className={className}>
      {children}
    </div>
  );
};

export default ScrollReveal;
