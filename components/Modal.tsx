'use client';

import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-surface/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-lg border border-gold w-full max-w-md shadow-2xl animate-[scale-in_0.2s_ease-out]">
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-subtle">
            <h3 className="text-xl font-bold text-text font-display">{title}</h3>
            <button
              onClick={onClose}
              className="text-textMuted hover:text-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
