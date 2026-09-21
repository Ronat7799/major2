import { useCallback, useEffect, useState } from 'react';

// Toggles visible on/off every time the element enters/leaves the viewport,
// so the reveal animation replays on every scroll pass, not just the first.
// Respects prefers-reduced-motion by skipping straight to "visible" and never
// toggling back off.
//
// Uses a callback ref (not useRef) so the observer attaches whenever the DOM
// node actually mounts — some callers (e.g. a card grid that only renders
// after data finishes loading) attach the ref later than the hook's own first
// render, and a plain useRef + effect-on-mount would miss that node entirely.
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

// Inline style for a fade + slight-upward-move reveal. `transform` is only set
// while hidden, so once visible it stops fighting hover-driven transform
// classes (inline styles otherwise always win over stylesheet rules). The
// stagger delay is reset to 0 once visible too, so it doesn't linger and make
// later hover transitions on the same element (e.g. a lift on hover) feel
// laggy — it only applies each time the entrance transition replays.
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
