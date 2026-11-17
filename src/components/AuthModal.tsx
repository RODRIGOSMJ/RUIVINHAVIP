import React, { useEffect, useState } from 'react';
import { LogOut, X } from 'lucide-react';
import type { UserAccount } from '../types';
import { CreatorAvatar } from './CreatorAvatar';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: UserAccount | null;
  hasSupabase: boolean;
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
  onEmailAuth: (mode: 'login' | 'signup', email: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  hasSupabase,
  onClose,
  onGoogleLogin,
  onEmailAuth,
  onLogout,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;
    setIsSubmitting(true);
    try {
      await onEmailAuth(authMode, email.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Autenticação Ruivinha VIP"
    >
      <div
        className="bg-obsidian-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar janela"
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-obsidian-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <CreatorAvatar size="md" />
          <h3 className="font-display font-bold text-xl text-white">Acesse o Ruivinha VIP</h3>
          <p className="text-xs text-zinc-400 max-w-xs">
            Entre para desbloquear seus vídeos, fotos e acompanhar suas chamadas privadas.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoogleLogin}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm flex items-center justify-center gap-3 transition-colors"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
            />
          </svg>
          <span>Continuar com Google</span>
        </button>

        {!hasSupabase && (
          <p className="text-[11px] text-zinc-500 text-center mt-2">
            Modo demonstração ativo · Conecte o Supabase no Painel Admin para OAuth real.
          </p>
        )}

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-obsidian-900 text-zinc-500">ou com e-mail e senha</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-obsidian-950 rounded-xl border border-zinc-800 mb-4">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              authMode === 'login' ? 'bg-obsidian-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              authMode === 'signup' ? 'bg-obsidian-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-400 mb-1">
              Seu E-mail
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
              className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-400 mb-1">
              Senha (mínimo 6 caracteres)
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl ruiva-gradient text-white font-bold text-sm hover:opacity-95 disabled:opacity-60 transition-opacity"
          >
            {isSubmitting
              ? 'Processando...'
              : authMode === 'login'
                ? 'Entrar na Conta'
                : 'Criar Conta Grátis'}
          </button>
        </form>

        {currentUser && (
          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-300 truncate">
              Logado como: <strong className="text-white">{currentUser.email}</strong>
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 text-xs text-rosegold-400 hover:underline font-semibold shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
