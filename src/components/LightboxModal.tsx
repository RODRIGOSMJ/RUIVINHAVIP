import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { SafeImage } from './SafeImage';

interface LightboxModalProps {
  src: string | null;
  caption: string;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({ src, caption, onClose }) => {
  useEffect(() => {
    if (!src) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visualização ampliada"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar imagem"
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-obsidian-900 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-obsidian-800 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        className="max-w-4xl w-full max-h-[88vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-h-[76vh] rounded-2xl overflow-hidden bg-obsidian-950 border border-zinc-800 flex items-center justify-center">
          <SafeImage
            src={src}
            alt={caption}
            className="max-h-[76vh] w-auto object-contain"
          />
        </div>
        {caption && (
          <p className="text-sm text-zinc-300 text-center max-w-2xl">{caption}</p>
        )}
      </div>
    </div>
  );
};
