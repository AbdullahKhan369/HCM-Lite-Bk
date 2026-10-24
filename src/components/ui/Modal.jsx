'use client';
import { useEffect } from 'react';

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="mt-8 w-full max-w-lg rounded-lg bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded px-2 text-xl text-gray-500 hover:bg-gray-100" aria-label="Close">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
