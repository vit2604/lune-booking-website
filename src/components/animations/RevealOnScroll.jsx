import { forwardRef } from 'react';
import useScrollReveal from '../../hooks/useScrollReveal.js';

const transforms = {
  up: 'translate3d(0, 28px, 0)',
  down: 'translate3d(0, -28px, 0)',
  left: 'translate3d(28px, 0, 0)',
  right: 'translate3d(-28px, 0, 0)',
  none: 'none',
};

function assignRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

const RevealOnScroll = forwardRef(function RevealOnScroll({
  as: Component = 'div',
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 650,
  once = true,
  threshold = 0,
  variant = 'slide',
  ...props
}, forwardedRef) {
  const { ref, isVisible } = useScrollReveal({ once, threshold });

  const setNode = (node) => {
    ref.current = node;
    assignRef(forwardedRef, node);
  };

  return (
    <Component
      ref={setNode}
      className={`reveal-on-scroll reveal-variant-${variant} ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
      style={{
        '--reveal-delay': `${delay}ms`,
        '--reveal-duration': `${duration}ms`,
        '--reveal-transform': transforms[direction] || transforms.up,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});

export default RevealOnScroll;
