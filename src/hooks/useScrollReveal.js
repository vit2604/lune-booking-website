import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export default function useScrollReveal({ once = true, rootMargin = '0px 0px -12% 0px', threshold = 0 } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    // include 0 so sections taller than the viewport (ratio never reaches threshold) still reveal
    const thresholds = Array.from(new Set([0, threshold])).sort((a, b) => a - b);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold: thresholds },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, isVisible };
}
