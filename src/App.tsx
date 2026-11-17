import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { Check, Eye, EyeOff, LogOut, Send, SlidersHorizontal, Sparkles, User, Video } from 'lucide-react';
import {
  OperationType,
  auth,
  clearCustomFirebaseConfig,
  db,
  firebaseConfig,
  handleFirestoreError,
  saveCustomFirebaseConfig,
  storage,
  type FirebaseConfigValues,
} from './firebase';
import type {
  CheckoutItem,
  FeedFilter,
  IntegrationConfig,
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
  POSTS_PAGE_SIZE,
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

function formatFirestoreDate(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value) {
    const date = (value as Timestamp).toDate();
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return 'Agora mesmo';
}

function mapPostDoc(snapshotDoc: QueryDocumentSnapshot<DocumentData>): Post {
  const data = snapshotDoc.data();
  return {
    id: snapshotDoc.id,
    authorId: typeof data.authorId === 'string' ? data.authorId : undefined,
    createdAt: formatFirestoreDate(data.createdAt),
    caption: String(data.caption || ''),
    mediaType: data.mediaType === 'video' ? 'video' : 'photo',
    accessType:
      data.accessType === 'free' || data.accessType === 'ppv' ? data.accessType : 'vip',
    price: Number(data.price || 0),
    thumbUrl: String(data.thumbUrl || ''),
    bunnyVideoId: String(data.bunnyVideoId || ''),
    likes: Number(data.likes || 0),
    isSeed: false,
  };
}

function mapFirebaseAuthError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: string }).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Faça login na aba Entrar.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.';
    case 'auth/operation-not-allowed':
      return 'Login por e-mail/senha não ativado no Console do Firebase (Authentication > Sign-in method).';
    case 'auth/popup-closed-by-user':
      return 'Login com Google cancelado antes da conclusão.';
    case 'auth/unauthorized-domain':
      return 'Domínio não autorizado no Firebase Authentication.';
    default:
      return error instanceof Error ? error.message : 'Falha na autenticação Firebase.';
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

  const [firestorePosts, setFirestorePosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMorePosts, setHasMorePosts] = useState<boolean>(false);
  const [lastPostDoc, setLastPostDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [previewVipOverride, setPreviewVipOverride] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PREVIEW_VIP) === 'true';
    } catch {
      return false;
    }
  });
  const [unlockedPostIds, setUnlockedPostIds] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>(() =>
    readStoredJson<string[]>(STORAGE_KEYS.LIKED_POSTS, [])
  );
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(() =>
    readStoredJson<IntegrationConfig>(STORAGE_KEYS.CONFIG, {
      bunnyLibId: '',
      pixGoldKey: '',
      tgBotToken: '',
      tgChatId: '',
    })
  );

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [authContextMessage, setAuthContextMessage] = useState<string | null>(null);

  const [pendingCheckoutItem, setPendingCheckoutItem] = useState<CheckoutItem | null>(null);
  const pendingCheckoutRef = useRef<CheckoutItem | null>(null);
  const pendingSignupTelegramRef = useRef<string | undefined>(undefined);

  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [lightboxState, setLightboxState] = useState<{ src: string | null; caption: string }>({
    src: null,
    caption: '',
  });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const setPendingItem = useCallback((item: CheckoutItem | null) => {
    pendingCheckoutRef.current = item;
    setPendingCheckoutItem(item);
  }, []);

  const fetchInitialPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PAGE_SIZE)
      );
      const snapshot = await getDocs(postsQuery);
      const loaded = snapshot.docs.map(mapPostDoc);
      setFirestorePosts(loaded);
      setLastPostDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMorePosts(snapshot.docs.length === POSTS_PAGE_SIZE);
    } catch (error) {
      console.error('Erro ao carregar posts paginados:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  const handleLoadMorePosts = async () => {
    if (!lastPostDoc || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastPostDoc),
        limit(POSTS_PAGE_SIZE)
      );
      const snapshot = await getDocs(nextQuery);
      const nextPosts = snapshot.docs.map(mapPostDoc);
      setFirestorePosts((prev) => [...prev, ...nextPosts]);
      setLastPostDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMorePosts(snapshot.docs.length === POSTS_PAGE_SIZE);
    } catch (error) {
      showToast('Não foi possível carregar mais publicações.', 'error');
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialPosts();
  }, [fetchInitialPosts]);

  // Monitora estado de login Firebase em tempo real e sincroniza coleção `users` no Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setUnlockedPostIds([]);
        setTransactions([]);
        return;
      }

      const userPath = `users/${firebaseUser.uid}`;
      const userRef = doc(db, 'users', firebaseUser.uid);
      let isVipFromDb = false;
      let savedTelegram = pendingSignupTelegramRef.current || '';
      const resolvedEmail = firebaseUser.email || `${firebaseUser.uid}@ruivinhavip.app`;
      const resolvedName = firebaseUser.displayName || resolvedEmail.split('@')[0];

      try {
        const existingSnap = await getDoc(userRef);
        if (existingSnap.exists()) {
          const data = existingSnap.data();
          isVipFromDb = Boolean(data.isVipSubscriber);
          if (!savedTelegram && typeof data.telegramUsername === 'string') {
            savedTelegram = data.telegramUsername;
          }
          await updateDoc(userRef, {
            email: resolvedEmail,
            displayName: resolvedName,
            ...(pendingSignupTelegramRef.current
              ? { telegramUsername: pendingSignupTelegramRef.current }
              : {}),
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: resolvedEmail,
            displayName: resolvedName,
            telegramUsername: savedTelegram,
            isVipSubscriber: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        pendingSignupTelegramRef.current = undefined;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }

      setCurrentUser({
        uid: firebaseUser.uid,
        email: resolvedEmail,
        displayName: resolvedName,
        telegramUsername: savedTelegram || undefined,
        isVipSubscriber: isVipFromDb,
      });

      // Carrega posts PPV desbloqueados do usuário
      try {
        const unlockedSnap = await getDocs(
          collection(db, 'users', firebaseUser.uid, 'unlockedPosts')
        );
        setUnlockedPostIds(unlockedSnap.docs.map((d) => d.id));
      } catch (error) {
        console.warn('Erro ao ler unlockedPosts:', error);
      }

      // Carrega histórico recente de transações do usuário (ou todas se for admin)
      try {
        const isAdminEmail =
          firebaseUser.email === 'rodrigotricollorgamer@gmail.com' &&
          firebaseUser.emailVerified;
        const txQuery = isAdminEmail
          ? query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(20))
          : query(
              collection(db, 'transactions'),
              where('userId', '==', firebaseUser.uid),
              orderBy('createdAt', 'desc'),
              limit(20)
            );
        const txSnap = await getDocs(txQuery);
        setTransactions(
          txSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              time: formatFirestoreDate(data.createdAt),
              client: String(data.clientTelegram || ''),
              title: String(data.title || ''),
              amount: Number(data.amount || 0),
            };
          })
        );
      } catch (error) {
        console.warn('Aviso ao ler transactions:', error);
      }

      // Se havia item pendente antes do login, fecha modal auth e abre checkout automaticamente
      if (pendingCheckoutRef.current) {
        const itemToOpen = pendingCheckoutRef.current;
        setPendingItem(null);
        setIsAuthModalOpen(false);
        setAuthContextMessage(null);
        setCheckoutItem(itemToOpen);
      } else {
        setIsAuthModalOpen(false);
      }
    });

    return () => unsubscribe();
  }, [setPendingItem]);

  const isVipSubscriber = Boolean(currentUser?.isVipSubscriber) || previewVipOverride;

  const displayedPosts = firestorePosts.length > 0 ? firestorePosts : DEFAULT_POSTS;

  const handleToggleVipPreview = () => {
    const next = !previewVipOverride;
    setPreviewVipOverride(next);
    try {
      localStorage.setItem(STORAGE_KEYS.PREVIEW_VIP, String(next));
    } catch {
      // ignore
    }
    showToast(
      next
        ? 'Modo Preview VIP ativado: conteúdos de assinatura desbloqueados.'
        : 'Modo Preview VIP desativado.',
      'info'
    );
  };

  const openAuthPrompt = (mode: 'login' | 'signup' = 'login', message: string | null = null) => {
    setAuthModalMode(mode);
    setAuthContextMessage(message);
    setIsAuthModalOpen(true);
  };

  // Trava estilo Privacy: impede abertura do checkout sem usuário autenticado
  const handleOpenCheckout = (
    kind: 'subscription' | 'ppv' | 'package',
    itemId?: string
  ) => {
    let targetItem: CheckoutItem | null = null;

    if (kind === 'subscription') {
      targetItem = {
        kind: 'subscription',
        id: 'vip-monthly',
        title: 'Assinatura Mensal Ruivinha VIP (30 dias)',
        price: 49.9,
      };
    } else if (kind === 'ppv' && itemId) {
      const post = displayedPosts.find((p) => p.id === itemId);
      if (!post) return;
      targetItem = {
        kind: 'ppv',
        id: post.id,
        title: `Conteúdo Avulso: ${post.caption.slice(0, 40)}...`,
        price: Number(post.price),
      };
    } else if (kind === 'package' && itemId) {
      const pkg = CALLS_AND_PACKAGES.find((c) => c.id === itemId);
      if (!pkg) return;
      targetItem = {
        kind: pkg.type,
        id: pkg.id,
        title: pkg.title,
        price: pkg.price,
      };
    }

    if (!targetItem) return;

    if (!currentUser) {
      setPendingItem(targetItem);
      openAuthPrompt(
        'signup',
        'Crie sua conta gratuita para assinar e salvar seu acesso VIP.'
      );
      return;
    }

    setCheckoutItem(targetItem);
  };

  const handleConfirmPayment = async (telegramHandle: string) => {
    if (!checkoutItem || !currentUser) return;

    try {
      if (checkoutItem.kind === 'subscription') {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isVipSubscriber: true,
          telegramUsername: telegramHandle,
          updatedAt: serverTimestamp(),
        });
        setCurrentUser((prev) =>
          prev ? { ...prev, isVipSubscriber: true, telegramUsername: telegramHandle } : prev
        );
      } else if (checkoutItem.kind === 'ppv') {
        setUnlockedPostIds((prev) =>
          prev.includes(checkoutItem.id) ? prev : [...prev, checkoutItem.id]
        );
        const isSeedPost = displayedPosts.find((p) => p.id === checkoutItem.id)?.isSeed;
        if (!isSeedPost) {
          await setDoc(doc(db, 'users', currentUser.uid, 'unlockedPosts', checkoutItem.id), {
            postId: checkoutItem.id,
            userId: currentUser.uid,
            unlockedAt: serverTimestamp(),
          });
        }
      }

      const txRef = await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        clientTelegram: telegramHandle,
        itemKind: checkoutItem.kind,
        itemId: checkoutItem.id,
        title: checkoutItem.title,
        amount: checkoutItem.price,
        createdAt: serverTimestamp(),
      });

      const newTx: TransactionLog = {
        id: txRef.id,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        client: telegramHandle,
        title: checkoutItem.title,
        amount: checkoutItem.price,
      };
      setTransactions((prev) => [newTx, ...prev]);
      showToast('Pagamento confirmado e salvo no Firestore.', 'success');
    } catch (error) {
      showToast('Erro ao registrar liberação no Firestore.', 'error');
      console.error(error);
    }
  };

  const handleLikePost = async (postId: string) => {
    const targetPost = displayedPosts.find((p) => p.id === postId);
    if (!targetPost) return;

    const alreadyLiked = likedPostIds.includes(postId);
    const delta = alreadyLiked ? -1 : 1;

    if (!targetPost.isSeed) {
      if (!currentUser) {
        openAuthPrompt('login', 'Entre na sua conta para curtir as publicações.');
        return;
      }
      try {
        await updateDoc(doc(db, 'posts', postId), {
          likes: increment(delta),
        });
      } catch (error) {
        showToast('Não foi possível registrar a curtida.', 'error');
        console.error(error);
        return;
      }
    }

    const nextLiked = alreadyLiked
      ? likedPostIds.filter((id) => id !== postId)
      : [...likedPostIds, postId];

    setLikedPostIds(nextLiked);
    try {
      localStorage.setItem(STORAGE_KEYS.LIKED_POSTS, JSON.stringify(nextLiked));
    } catch {
      // ignore
    }

    if (!targetPost.isSeed) {
      setFirestorePosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likes: Math.max(0, post.likes + delta) } : post
        )
      );
    }
  };

  const handleCreatePost = async (
    draft: Omit<Post, 'id' | 'createdAt' | 'likes'>,
    photoFile: File | null
  ): Promise<boolean> => {
    if (!currentUser) {
      openAuthPrompt('login', 'Faça login com sua conta de criadora para publicar.');
      return false;
    }

    setIsPublishingPost(true);
    let finalThumbUrl = draft.thumbUrl;

    try {
      if (draft.mediaType === 'photo' && photoFile) {
        const safeName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageRef = ref(storage, `posts_vip/${Date.now()}_${safeName}`);
        const uploadTask = uploadBytesResumable(storageRef, photoFile);

        finalThumbUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploadProgress(progress);
            },
            (err) => reject(err),
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      const payload = {
        authorId: currentUser.uid,
        caption: draft.caption,
        mediaType: draft.mediaType,
        accessType: draft.accessType,
        price: Number(draft.price || 0),
        thumbUrl: finalThumbUrl,
        bunnyVideoId: draft.bunnyVideoId,
        likes: 0,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'posts'), payload);
      const createdPost: Post = {
        id: docRef.id,
        authorId: currentUser.uid,
        createdAt: 'Agora mesmo',
        caption: draft.caption,
        mediaType: draft.mediaType,
        accessType: draft.accessType,
        price: Number(draft.price || 0),
        thumbUrl: finalThumbUrl,
        bunnyVideoId: draft.bunnyVideoId,
        likes: 0,
        isSeed: false,
      };

      setFirestorePosts((prev) => [createdPost, ...prev]);
      setActiveTab('feed');
      setActiveFilter('all');
      showToast('Post publicado no Firestore com sucesso.', 'success');
      return true;
    } catch (error) {
      const msg =
        error instanceof Error && error.message.includes('permission')
          ? 'Permissão negada ao publicar. Verifique se você está logada com o e-mail administrador.'
          : 'Erro ao publicar post no Firebase.';
      showToast(msg, 'error');
      console.error(error);
      return false;
    } finally {
      setIsPublishingPost(false);
      setUploadProgress(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setFirestorePosts((prev) => prev.filter((p) => p.id !== postId));
      showToast('Publicação removida do Firestore.', 'info');
    } catch (error) {
      showToast('Erro ao remover publicação do Firestore.', 'error');
      console.error(error);
    }
  };

  const handleSaveFirebaseConfig = (nextConfig: FirebaseConfigValues) => {
    saveCustomFirebaseConfig(nextConfig);
    showToast('firebaseConfig atualizado! Recarregando...', 'success');
    setTimeout(() => window.location.reload(), 600);
  };

  const handleResetFirebaseConfig = () => {
    clearCustomFirebaseConfig();
    showToast('firebaseConfig restaurado para o projeto provisionado. Recarregando...', 'info');
    setTimeout(() => window.location.reload(), 600);
  };

  const handleSaveIntegrationConfig = (nextConfig: IntegrationConfig) => {
    setIntegrationConfig(nextConfig);
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(nextConfig));
    } catch {
      // ignore
    }
    showToast('Configurações de Bunny / PixGo / Telegram salvas.', 'success');
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast('Autenticado com Google com sucesso.', 'success');
    } catch (error) {
      showToast(mapFirebaseAuthError(error), 'error');
    }
  };

  const handleEmailAuth = async (
    mode: 'login' | 'signup',
    email: string,
    password: string,
    telegramUsername?: string
  ) => {
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login realizado com sucesso.', 'success');
      } else {
        if (telegramUsername) {
          pendingSignupTelegramRef.current = telegramUsername;
        }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (credential.user && !credential.user.displayName) {
          await updateProfile(credential.user, {
            displayName: email.split('@')[0],
          });
        }
        showToast('Conta criada com sucesso!', 'success');
      }
    } catch (error) {
      pendingSignupTelegramRef.current = undefined;
      showToast(mapFirebaseAuthError(error), 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthModalOpen(false);
      setCheckoutItem(null);
      setPendingItem(null);
      showToast('Você saiu da sua conta.', 'info');
    } catch (error) {
      showToast('Erro ao sair da conta.', 'error');
      console.error(error);
    }
  };

  const totalVideosCount = 61 + displayedPosts.filter((p) => p.mediaType === 'video').length;
  const totalPostsCount = 145 + displayedPosts.length;

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

      {/* Top Bar Contract: Brand -> single-line nav links -> Logged-in profile / Login action */}
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

          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => openAuthPrompt('login', null)}
                  className="text-xs sm:text-sm font-medium text-zinc-200 hover:text-white inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
                >
                  <User className="w-4 h-4 text-copper-400" />
                  <span className="max-w-[140px] truncate">
                    {currentUser.displayName || currentUser.email.split('@')[0]}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-xl bg-obsidian-900 border border-zinc-700/80 hover:border-rosegold-500/60 text-xs font-semibold text-zinc-200 hover:text-rosegold-300 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => openAuthPrompt('login', null)}
                className="px-4 py-2 rounded-xl ruiva-gradient text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 hover:opacity-95 transition-opacity"
              >
                <User className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pb-16">
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
                  <span>Simular Visão VIP: {previewVipOverride ? 'ON' : 'OFF'}</span>
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
            posts={displayedPosts}
            activeFilter={activeFilter}
            onChangeFilter={setActiveFilter}
            isVipSubscriber={isVipSubscriber}
            unlockedPostIds={unlockedPostIds}
            likedPostIds={likedPostIds}
            bunnyLibId={integrationConfig.bunnyLibId}
            isLoadingPosts={isLoadingPosts}
            hasMorePosts={hasMorePosts}
            isLoadingMore={isLoadingMore}
            onLoadMorePosts={handleLoadMorePosts}
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
            currentUser={currentUser}
            firebaseConfigValues={firebaseConfig}
            integrationConfig={integrationConfig}
            posts={displayedPosts}
            transactions={transactions}
            uploadProgress={uploadProgress}
            isPublishingPost={isPublishingPost}
            onSaveFirebaseConfig={handleSaveFirebaseConfig}
            onResetFirebaseConfig={handleResetFirebaseConfig}
            onSaveIntegrationConfig={handleSaveIntegrationConfig}
            onCreatePost={handleCreatePost}
            onDeletePost={handleDeletePost}
            onRequireLogin={() =>
              openAuthPrompt('login', 'Faça login com sua conta de criadora para gerenciar publicações.')
            }
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
        initialMode={authModalMode}
        contextMessage={authContextMessage}
        currentUser={currentUser}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingItem(null);
          setAuthContextMessage(null);
        }}
        onGoogleLogin={handleGoogleLogin}
        onEmailAuth={handleEmailAuth}
        onLogout={handleLogout}
      />

      <CheckoutModal
        item={checkoutItem}
        defaultTelegramHandle={currentUser?.telegramUsername}
        onClose={() => setCheckoutItem(null)}
        onGenerateQr={() => showToast('QR Code PixGo gerado. Aguardando pagamento...', 'info')}
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
