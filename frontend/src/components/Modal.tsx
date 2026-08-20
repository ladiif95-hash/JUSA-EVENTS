import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export default function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const key = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={event => event.stopPropagation()}>
      <header className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Close dialog"><X/></button>
      </header>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}
