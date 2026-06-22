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

    // Always include 0 in the threshold list so the reveal still fires for
    // elements taller than the viewport. A single non-zero threshold (e.g. 0.12)
    // can never be reached when the element is taller than ~viewport/threshold,
    // which would leave the whole section permanently invisible. rootMargin
    // controls the "reveal slightly after it enters" feel instead.
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
