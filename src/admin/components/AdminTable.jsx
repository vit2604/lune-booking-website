import { MoveHorizontal } from 'lucide-react';
import { useRef, useState } from 'react';

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, label, [role="button"]';

export default function AdminTable({ children, empty, draggable = false }) {
  const scrollRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (event) => {
    if (!draggable || event.button !== 0 || event.pointerType === 'touch') return;
    if (event.target.closest(INTERACTIVE_SELECTOR)) return;

    const scroller = scrollRef.current;
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
      moved: false,
    };
    scroller.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    const scroller = scrollRef.current;
    if (!drag || !scroller || drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) < 5) return;

    drag.moved = true;
    suppressClickRef.current = true;
    setIsDragging(true);
    scroller.scrollLeft = drag.scrollLeft - distance;
    event.preventDefault();
  };

  const endDrag = (event) => {
    const drag = dragRef.current;
    const scroller = scrollRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (scroller?.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleClickCapture = (event) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      {draggable && children ? (
        <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50 px-4 py-2 text-xs font-medium text-stone-500">
          <MoveHorizontal className="h-4 w-4 text-lune-goldDark" aria-hidden="true" />
          <span>Hold and drag the table left or right to see all columns</span>
        </div>
      ) : null}
      <div
        ref={scrollRef}
        className={`overflow-x-auto ${draggable ? (isDragging ? 'cursor-grabbing select-none' : 'cursor-grab') : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={handleClickCapture}
      >
        {children || (
          <div className="p-8 text-center text-sm text-stone-500">
            {empty || 'No data available.'}
          </div>
        )}
      </div>
    </div>
  );
}
