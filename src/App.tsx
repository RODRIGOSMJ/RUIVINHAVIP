import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Check, Eye, EyeOff, Send, SlidersHorizontal, Sparkles, User, Video } from 'lucide-react';
import type {
  ApiConfig,
  CheckoutItem,
  FeedFilter,
  Post,
  TabId,
  ToastMessage,
  TransactionLog,
  UserAccount,
} from './types';
import {
  CALLS_AND_PACKAGES,
  COVER_BACKDROP_IMAGE,
  DEFAULT_POSTS,
  STORAGE_KEYS,
  formatBRL,
} from './data/initialData';
import { CreatorAvatar } from './components/CreatorAvatar';
import { SafeImage } from './components/SafeImage';
import { FeedView } from './components/FeedView';
import { CallsPackagesView } from './components/CallsPackagesView';
import { AdminView } from './components/AdminView';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { LightboxModal } from './components/LightboxModal';

function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

  const [posts, setPosts] = useState<Post[]>(() =>
    readStoredJson<Post[]>(STORAGE_KEYS.POSTS, DEFAULT_POSTS)
  );
  const [isVipSubscriber, setIsVipSubscriber] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION) === 'true';
    } catch {
      return false;
    }
  });
  const [unlockedPostIds, setUnlockedPostIds] = useState<string[]>(() =>
    readStoredJson<string[]>(STORAGE_KEYS.UNLOCKED, [])
  );
  const [likedPostIds, setLikedPostIds] = useState<string[]>(() =>
    readStoredJson<string[]>(STORAGE_KEYS.LIKED_POSTS, [])
  );
  const [transactions, setTransactions] = useState<TransactionLog[]>(() =>
    readStoredJson<TransactionLog[]>(STORAGE_KEYS.LOGS, [])
  );
  const [config, setConfig] = useState<ApiConfig>(() =>
    readStoredJson<ApiConfig>(STORAGE_KEYS.CONFIG, {
      supabaseUrl: '',
      supabaseKey: '',
      bunnyLibId: '',
      pixGoldKey: '',
      tgBotToken: '',
      tgChatId: '',
    })
  );

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [lightboxState, setLightboxState] = useState<{ src: string | null; caption: string }>({
    src: null,
    caption: '',
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const supabaseClient: SupabaseClient | null = useMemo(() => {
    if (!config.supabaseUrl.trim() || !config.supabaseKey.trim()) return null;
    try {
      return createClient(config.supabaseUrl.trim(), config.supabaseKey.trim());
    } catch {
      return null;
    }
  }, [config.supabaseUrl, config.supabaseKey]);

  useEffect(() => {
    if (!supabaseClient) return;

    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setCurrentUser({ email: data.session.user.email });
      }
    });

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setCurrentUser({ email: session.user.email });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabaseClient]);

  const handleToggleVipPreview = () => {
    const next = !isVipSubscriber;
    setIsVipSubscriber(next);
    try {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, String(next));
    } catch {
      // ignore storage errors
    }
    showToast(
      next
        ? 'Modo Preview VIP ativado: conteúdos de assinatura desbloqueados.'
        : 'Modo Visitante ativado: conteúdos bloqueados novamente.',
      'info'
    );
  };

  const handleOpenCheckout = (
    kind: 'subscription' | 'ppv' | 'package',
    itemId?: string
  ) => {
    if (kind === 'subscription') {
      setCheckoutItem({
        kind: 'subscription',
        id: 'vip-monthly',
        title: 'Assinatura Mensal Ruivinha VIP (30 dias)',
        price: 49.9,
      });
      return;
    }

    if (kind === 'ppv' && itemId) {
      const post = posts.find((p) => p.id === itemId);
      if (!post) return;
      setCheckoutItem({
        kind: 'ppv',
        id: post.id,
        title: `Conteúdo Avulso: ${post.caption.slice(0, 40)}...`,
        price: Number(post.price),
      });
      return;
    }

    if (kind === 'package' && itemId) {
      const pkg = CALLS_AND_PACKAGES.find((c) => c.id === itemId);
      if (!pkg) return;
      setCheckoutItem({
        kind: pkg.type,
        id: pkg.id,
        title: pkg.title,
        price: pkg.price,
      });
    }
  };

  const handleConfirmPayment = (telegramHandle: string) => {
    if (!checkoutItem) return;

    if (checkoutItem.kind === 'subscription') {
      setIsVipSubscriber(true);
      try {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, 'true');
      } catch {
        // ignore
      }
    } else if (checkoutItem.kind === 'ppv') {
      setUnlockedPostIds((prev) => {
        if (prev.includes(checkoutItem.id)) return prev;
        const next = [...prev, checkoutItem.id];
        try {
          localStorage.setItem(STORAGE_KEYS.UNLOCKED, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }

    const newTx: TransactionLog = {
      id: `tx-${Date.now()}`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      client: telegramHandle,
      title: checkoutItem.title,
      amount: checkoutItem.price,
    };

    setTransactions((prev) => {
      const next = [newTx, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    showToast('Pagamento aprovado e conteúdo liberado.', 'success');
  };

  const handleLikePost = (postId: string) => {
    const alreadyLiked = likedPostIds.includes(postId);

    const nextLiked = alreadyLiked
      ? likedPostIds.filter((id) => id !== postId)
      : [...likedPostIds, postId];

    setLikedPostIds(nextLiked);
    try {
      localStorage.setItem(STORAGE_KEYS.LIKED_POSTS, JSON.stringify(nextLiked));
    } catch {
      // ignore
    }

    setPosts((prev) => {
      const next = prev.map((post) =>
        post.id === postId
          ? { ...post, likes: Math.max(0, post.likes + (alreadyLiked ? -1 : 1)) }
          : post
      );
      try {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCreatePost = (draft: Omit<Post, 'id' | 'createdAt' | 'likes'>) => {
    const newPost: Post = {
      id: `post-${Date.now()}`,
      createdAt: 'Agora mesmo',
      likes: 1,
      ...draft,
    };
    const next = [newPost, ...posts];
    setPosts(next);
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(next));
    } catch {
      // ignore
    }
    setActiveTab('feed');
    setActiveFilter('all');
    showToast('Novo conteúdo publicado no Feed.', 'success');
  };

  const handleDeletePost = (postId: string) => {
    const next = posts.filter((p) => p.id !== postId);
    setPosts(next);
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(next));
    } catch {
      // ignore
    }
    showToast('Publicação removida do Feed.', 'info');
  };

  const handleSaveConfig = (nextConfig: ApiConfig) => {
    setConfig(nextConfig);
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(nextConfig));
    } catch {
      // ignore
    }
    showToast('Configurações de integração salvas.', 'success');
  };

  const handleResetDemo = () => {
    setPosts(DEFAULT_POSTS);
    setIsVipSubscriber(false);
    setUnlockedPostIds([]);
    setLikedPostIds([]);
    setTransactions([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.POSTS);
      localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION);
      localStorage.removeItem(STORAGE_KEYS.UNLOCKED);
      localStorage.removeItem(STORAGE_KEYS.LIKED_POSTS);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
    } catch {
      // ignore
    }
    showToast('Dados de demonstração restaurados.', 'info');
  };

  const handleGoogleLogin = async () => {
    if (!supabaseClient) {
      setCurrentUser({ email: 'assinante.demo@ruivinhavip.com', isDemo: true });
      setIsAuthModalOpen(false);
      showToast('Modo Demo: sessão autenticada localmente.', 'success');
      return;
    }

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      showToast(`Erro Google Auth: ${error.message}`, 'error');
    }
  };

  const handleEmailAuth = async (
    mode: 'login' | 'signup',
    email: string,
    password: string
  ) => {
    if (!supabaseClient) {
      setCurrentUser({ email, isDemo: true });
      setIsAuthModalOpen(false);
      showToast(`Modo Demo: bem-vindo, ${email}.`, 'success');
      return;
    }

    if (mode === 'login') {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      showToast('Login realizado com sucesso.', 'success');
      setIsAuthModalOpen(false);
    } else {
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      showToast('Conta criada! Verifique seu e-mail para confirmar.', 'success');
    }
  };

  const handleLogout = async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setCurrentUser(null);
    setIsAuthModalOpen(false);
    showToast('Você saiu da sua conta.', 'info');
  };

  const totalVideosCount = 61 + posts.filter((p) => p.mediaType === 'video').length;
  const totalPostsCount = 145 + posts.length;

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 text-zinc-100">
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const style =
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
                : 'bg-obsidian-900/95 border-copper-500/50 text-zinc-100';
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto px-4 py-3 rounded-xl border ${style} text-xs font-medium shadow-2xl backdrop-blur-md`}
            >
              {toast.message}
            </div>
          );
        })}
      </div>

      {/* Top Bar Contract: 3 zones (Wordmark -> concise single-line links -> 1 primary CTA) */}
      <header className="sticky top-0 z-40 glass-bar border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#feed"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('feed');
            }}
            className="flex items-center gap-2.5 font-display font-extrabold text-lg tracking-tight whitespace-nowrap shrink-0"
          >
            <CreatorAvatar size="sm" />
            <span>
              Ruivinha <span className="ruiva-text-gradient">VIP</span>
            </span>
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400"
          >
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'feed' ? 'text-white' : 'hover:text-zinc-100'
              }`}
            >
              Feed Exclusivo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calls')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'calls' ? 'text-white' : 'hover:text-zinc-100'
              }`}
            >
              Videochamadas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'admin' ? 'text-white' : 'hover:text-zinc-100'
              }`}
            >
              Painel Admin
            </button>
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap shrink-0 hover:text-sky-400 transition-colors"
            >
              Telegram
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl ruiva-gradient text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 hover:opacity-95 transition-opacity"
            >
              <User className="w-4 h-4" />
              <span className="max-w-[140px] truncate">
                {currentUser ? currentUser.email.split('@')[0] : 'Entrar'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pb-16">
        {/* Hero / Perfil da Criadora */}
        <section className="pt-5">
          <div className="relative h-44 sm:h-64 w-full rounded-2xl overflow-hidden border border-zinc-800/80 bg-obsidian-900">
            <SafeImage
              src={COVER_BACKDROP_IMAGE}
              alt="Capa editorial Ruivinha VIP"
              fallbackLabel="Ruivinha VIP · Clube Privado"
              className="w-full h-full object-cover opacity-65"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/45 to-transparent" />
            <div className="absolute bottom-4 right-5 hidden sm:block text-xs font-medium text-zinc-300">
              Lives na <span className="text-copper-400 font-semibold">Superlive</span> ·{' '}
              <span className="text-rosegold-400 font-semibold">Buskets</span>
            </div>
          </div>

          <div className="px-1 sm:px-4 pb-6 border-b border-zinc-800/80">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 -mt-12 sm:-mt-16 relative z-10">
              <div className="flex items-end gap-4 sm:gap-5">
                <CreatorAvatar size="lg" />
                <div className="pb-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight text-balance">
                      Ruivinha VIP
                    </h1>
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-copper-600 text-white shrink-0"
                      title="Criadora Verificada"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    @ruivinhavip · Clube Privado ·{' '}
                    <span className={isVipSubscriber ? 'text-emerald-400 font-semibold' : 'text-zinc-300'}>
                      {isVipSubscriber ? 'Assinante VIP Ativo' : 'Visitante'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleVipPreview}
                  className="px-4 py-2.5 rounded-xl bg-obsidian-900 border border-zinc-700/80 hover:border-copper-500 text-xs font-semibold text-zinc-200 inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
                >
                  {isVipSubscriber ? (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-zinc-400" />
                  )}
                  <span>Simular Visão VIP: {isVipSubscriber ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCheckout('subscription')}
                  className="px-5 py-2.5 rounded-xl ruiva-gradient text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 whitespace-nowrap shrink-0 hover:opacity-95 transition-opacity tabular-nums"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isVipSubscriber
                      ? 'Assinatura VIP Ativa'
                      : `Assinar VIP · ${formatBRL(49.9)}/mês`}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <p className="lg:col-span-8 text-sm text-zinc-300 leading-relaxed max-w-3xl">
                Bem-vindo ao meu cantinho secreto. Aqui você tem acesso aos bastidores das minhas lives na{' '}
                <strong className="text-copper-400 font-semibold">Superlive</strong> e{' '}
                <strong className="text-rosegold-400 font-semibold">Buskets</strong>, ensaios completos sem cortes, vídeos exclusivos e agendamento de{' '}
                <strong className="text-white font-semibold">videochamada privada</strong> com pagamento instantâneo via Pix e liberação automática no site e no Telegram.
              </p>

              <div className="lg:col-span-4 grid grid-cols-3 bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-3.5 text-center tabular-nums">
                <div>
                  <div className="font-display font-bold text-lg text-white">{totalPostsCount}</div>
                  <div className="text-xs text-zinc-400">Posts</div>
                </div>
                <div className="border-x border-zinc-800">
                  <div className="font-display font-bold text-lg text-copper-400">
                    {totalVideosCount}
                  </div>
                  <div className="text-xs text-zinc-400">Vídeos</div>
                </div>
                <div>
                  <div className="font-display font-bold text-lg text-rosegold-400">24/7</div>
                  <div className="text-xs text-zinc-400">Bot Telegram</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs secundárias (não-sticky para manter <15% no mobile) */}
        <div className="border-b border-zinc-800/80 flex items-center gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-colors ${
              activeTab === 'feed'
                ? 'border-copper-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Feed Exclusivo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={`py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-colors ${
              activeTab === 'calls'
                ? 'border-copper-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Video className="w-4 h-4 text-rosegold-400" />
            <span>Videochamadas &amp; Pacotes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-colors ${
              activeTab === 'admin'
                ? 'border-copper-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-copper-400" />
            <span>Painel Admin (Criadora)</span>
          </button>
        </div>

        {activeTab === 'feed' && (
          <FeedView
            posts={posts}
            activeFilter={activeFilter}
            onChangeFilter={setActiveFilter}
            isVipSubscriber={isVipSubscriber}
            unlockedPostIds={unlockedPostIds}
            likedPostIds={likedPostIds}
            bunnyLibId={config.bunnyLibId}
            onLikePost={handleLikePost}
            onOpenCheckout={(kind, postId) => handleOpenCheckout(kind, postId)}
            onOpenLightbox={(src, caption) => setLightboxState({ src, caption })}
          />
        )}

        {activeTab === 'calls' && (
          <CallsPackagesView
            packages={CALLS_AND_PACKAGES}
            onSelectPackage={(pkgId) => handleOpenCheckout('package', pkgId)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            config={config}
            posts={posts}
            transactions={transactions}
            onSaveConfig={handleSaveConfig}
            onCreatePost={handleCreatePost}
            onDeletePost={handleDeletePost}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      <footer className="border-t border-zinc-800/80 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <span>© 2026 Ruivinha VIP · Clube Privado</span>
          <div className="flex items-center gap-4">
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-sky-400 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Atendimento Telegram</span>
            </a>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Painel da Criadora
            </button>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        hasSupabase={Boolean(supabaseClient)}
        onClose={() => setIsAuthModalOpen(false)}
        onGoogleLogin={handleGoogleLogin}
        onEmailAuth={handleEmailAuth}
        onLogout={handleLogout}
      />

      <CheckoutModal
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onGenerateQr={() => showToast('QR Code Pix Gold gerado. Aguardando pagamento...', 'info')}
        onConfirmPayment={handleConfirmPayment}
        onCopyPix={() => showToast('Código Pix Copia e Cola copiado.', 'success')}
      />

      <LightboxModal
        src={lightboxState.src}
        caption={lightboxState.caption}
        onClose={() => setLightboxState({ src: null, caption: '' })}
      />
    </div>
  );
}
