import { useCallback, useEffect, useState } from 'react';

export function useReveal(threshold = 0.15) {
  const [node, setNode] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useCallback((el) => setNode(el), []);

  useEffect(() => {
    if (!node) {
      return undefined;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, threshold]);

  return [ref, visible];
}

export function revealStyle(visible, delayMs = 0) {
  const style = {
    transitionProperty: 'opacity, transform',
    transitionDuration: '650ms',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    transitionDelay: visible ? '0ms' : `${delayMs}ms`,
    opacity: visible ? 1 : 0,
  };
  if (!visible) {
    style.transform = 'translateY(28px)';
  }
  return style;
}
