import React, { useState } from 'react';
import {
  Flame,
  KeyRound,
  Loader2,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  AccessType,
  IntegrationConfig,
  MediaType,
  Post,
  TransactionLog,
  UserAccount,
} from '../types';
import type { FirebaseConfigValues } from '../firebase';
import { EDITORIAL_PREVIEW_IMAGE, PRESET_THUMBNAILS, formatBRL } from '../data/initialData';

interface AdminViewProps {
  currentUser: UserAccount | null;
  firebaseConfigValues: FirebaseConfigValues;
  integrationConfig: IntegrationConfig;
  posts: Post[];
  transactions: TransactionLog[];
  uploadProgress: number | null;
  isPublishingPost: boolean;
  onSaveFirebaseConfig: (nextConfig: FirebaseConfigValues) => void;
  onResetFirebaseConfig: () => void;
  onSaveIntegrationConfig: (nextConfig: IntegrationConfig) => void;
  onCreatePost: (
    post: Omit<Post, 'id' | 'createdAt' | 'likes'>,
    photoFile: File | null
  ) => Promise<boolean>;
  onDeletePost: (postId: string) => Promise<void>;
  onRequireLogin: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  firebaseConfigValues,
  integrationConfig,
  posts,
  transactions,
  uploadProgress,
  isPublishingPost,
  onSaveFirebaseConfig,
  onResetFirebaseConfig,
  onSaveIntegrationConfig,
  onCreatePost,
  onDeletePost,
  onRequireLogin,
}) => {
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [accessType, setAccessType] = useState<AccessType>('vip');
  const [bunnyVideoId, setBunnyVideoId] = useState('');
  const [thumbUrl, setThumbUrl] = useState(EDITORIAL_PREVIEW_IMAGE);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [price, setPrice] = useState('29.90');

  const [fbForm, setFbForm] = useState<FirebaseConfigValues>(firebaseConfigValues);
  const [intForm, setIntForm] = useState<IntegrationConfig>(integrationConfig);

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;

    const ok = await onCreatePost(
      {
        caption: caption.trim(),
        mediaType,
        accessType,
        price: accessType === 'ppv' ? parseFloat(price || '29.90') : 0,
        thumbUrl: thumbUrl.trim() || EDITORIAL_PREVIEW_IMAGE,
        bunnyVideoId: mediaType === 'video' ? bunnyVideoId.trim() : '',
      },
      mediaType === 'photo' ? photoFile : null
    );

    if (ok) {
      setCaption('');
      setBunnyVideoId('');
      setPhotoFile(null);
    }
  };

  const handleSaveFirebaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFirebaseConfig({
      apiKey: fbForm.apiKey.trim(),
      authDomain: fbForm.authDomain.trim(),
      projectId: fbForm.projectId.trim(),
      storageBucket: fbForm.storageBucket.trim(),
      messagingSenderId: fbForm.messagingSenderId.trim(),
      appId: fbForm.appId.trim(),
      firestoreDatabaseId: fbForm.firestoreDatabaseId?.trim() || '',
    });
  };

  const handleSaveIntegrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIntegrationConfig({
      bunnyLibId: intForm.bunnyLibId.trim(),
      pixGoldKey: intForm.pixGoldKey.trim(),
      tgBotToken: intForm.tgBotToken.trim(),
      tgChatId: intForm.tgChatId.trim(),
    });
  };

  return (
    <section className="pt-6 space-y-6">
      {!currentUser && (
        <div className="bg-obsidian-900 border border-copper-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-zinc-200">
            Para gravar posts no Firestore e enviar fotos para <span className="font-mono text-copper-400">posts_vip/</span> no Firebase Storage, faça login com sua conta de criadora.
          </p>
          <button
            type="button"
            onClick={onRequireLogin}
            className="px-4 py-2 rounded-xl ruiva-gradient text-white text-xs font-bold whitespace-nowrap shrink-0"
          >
            Entrar como Criadora
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-copper-400" />
              <span>Publicar Novo Post no Feed</span>
            </h2>
            <span className="text-xs text-zinc-400">Firestore · Storage · Bunny</span>
          </div>

          <form onSubmit={handlePublishSubmit} className="space-y-4">
            <div>
              <label htmlFor="post-caption" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Legenda / Descrição do Post
              </label>
              <textarea
                id="post-caption"
                rows={3}
                required
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ex: Bastidores da live de ontem na Superlive..."
                className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="post-media-type" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Tipo de Mídia
                </label>
                <select
                  id="post-media-type"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as MediaType)}
                  className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-copper-500"
                >
                  <option value="photo">Foto (Firebase Storage: posts_vip/)</option>
                  <option value="video">Vídeo (Bunny Stream ID)</option>
                </select>
              </div>

              <div>
                <label htmlFor="post-access-type" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Modelo de Acesso
                </label>
                <select
                  id="post-access-type"
                  value={accessType}
                  onChange={(e) => setAccessType(e.target.value as AccessType)}
                  className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-copper-500"
                >
                  <option value="vip">Assinatura VIP (Mensal)</option>
                  <option value="ppv">Avulso (PPV - Pago à parte)</option>
                  <option value="free">Prévia Gratuita (Público)</option>
                </select>
              </div>
            </div>

            {mediaType === 'photo' && (
              <div className="space-y-2">
                <label htmlFor="post-photo-file" className="block text-xs font-medium text-zinc-400">
                  Upload da Foto (Firebase Storage: <span className="font-mono text-copper-400">posts_vip/</span>)
                </label>
                <label
                  htmlFor="post-photo-file"
                  className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-obsidian-950 border border-dashed border-zinc-700 hover:border-copper-500 cursor-pointer transition-colors"
                >
                  <span className="text-xs text-zinc-300 truncate">
                    {photoFile
                      ? `Arquivo selecionado: ${photoFile.name}`
                      : 'Clique para escolher uma imagem (JPG, PNG, WEBP)'}
                  </span>
                  <Upload className="w-4 h-4 text-copper-400 shrink-0" />
                  <input
                    id="post-photo-file"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                </label>
                {uploadProgress !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-400 tabular-nums">
                      <span>Enviando para posts_vip/...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-obsidian-950 rounded-full overflow-hidden">
                      <div
                        className="h-full ruiva-gradient transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {mediaType === 'video' && (
              <div>
                <label htmlFor="post-bunny-id" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Bunny Stream Video ID (GUID)
                </label>
                <input
                  id="post-bunny-id"
                  type="text"
                  required={mediaType === 'video'}
                  value={bunnyVideoId}
                  onChange={(e) => setBunnyVideoId(e.target.value)}
                  placeholder="Ex: 8a4f92c1-7b3d-4e1a-9c2f-123456789abc"
                  className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Suba o vídeo no painel Bunny Stream e salve apenas o Video ID no Firestore.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="post-thumb-url" className="block text-xs font-medium text-zinc-400 mb-1.5">
                {mediaType === 'photo'
                  ? 'Ou URL / Preset alternativo (se não enviar arquivo)'
                  : 'Capa do Vídeo (Preset local ou URL)'}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_THUMBNAILS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => {
                      setThumbUrl(preset.url);
                      setPhotoFile(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      thumbUrl === preset.url && !photoFile
                        ? 'bg-copper-600/20 border-copper-500 text-copper-300'
                        : 'bg-obsidian-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                id="post-thumb-url"
                type="text"
                value={thumbUrl}
                onChange={(e) => setThumbUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-copper-500"
              />
            </div>

            {accessType === 'ppv' && (
              <div>
                <label htmlFor="post-price" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Valor Avulso PPV (R$)
                </label>
                <input
                  id="post-price"
                  type="number"
                  step="0.10"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3.5 py-2.5 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-copper-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isPublishingPost}
              className="w-full py-3 px-4 rounded-xl ruiva-gradient text-white font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-60 transition-opacity"
            >
              {isPublishingPost ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isPublishingPost ? 'Publicando no Firestore...' : 'Publicar Conteúdo Agora'}</span>
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-copper-400" />
                <span>Configuração do Firebase (firebaseConfig)</span>
              </h2>
              <span className="text-xs text-emerald-400 font-medium">Conectado</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              O projeto Firebase já está provisionado. Caso queira usar outro projeto Firebase próprio, cole suas chaves abaixo e salve (a página será recarregada).
            </p>

            <form onSubmit={handleSaveFirebaseSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fb-api-key" className="block text-xs font-medium text-zinc-400 mb-1">
                    apiKey
                  </label>
                  <input
                    id="fb-api-key"
                    type="text"
                    required
                    value={fbForm.apiKey}
                    onChange={(e) => setFbForm({ ...fbForm, apiKey: e.target.value })}
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-copper-500"
                  />
                </div>
                <div>
                  <label htmlFor="fb-project-id" className="block text-xs font-medium text-zinc-400 mb-1">
                    projectId
                  </label>
                  <input
                    id="fb-project-id"
                    type="text"
                    required
                    value={fbForm.projectId}
                    onChange={(e) => setFbForm({ ...fbForm, projectId: e.target.value })}
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-copper-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fb-auth-domain" className="block text-xs font-medium text-zinc-400 mb-1">
                    authDomain
                  </label>
                  <input
                    id="fb-auth-domain"
                    type="text"
                    required
                    value={fbForm.authDomain}
                    onChange={(e) => setFbForm({ ...fbForm, authDomain: e.target.value })}
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-copper-500"
                  />
                </div>
                <div>
                  <label htmlFor="fb-storage-bucket" className="block text-xs font-medium text-zinc-400 mb-1">
                    storageBucket
                  </label>
                  <input
                    id="fb-storage-bucket"
                    type="text"
                    required
                    value={fbForm.storageBucket}
                    onChange={(e) => setFbForm({ ...fbForm, storageBucket: e.target.value })}
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-copper-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fb-app-id" className="block text-xs font-medium text-zinc-400 mb-1">
                    appId
                  </label>
                  <input
                    id="fb-app-id"
                    type="text"
                    required
                    value={fbForm.appId}
                    onChange={(e) => setFbForm({ ...fbForm, appId: e.target.value })}
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-copper-500"
                  />
                </div>
                <div>
                  <label htmlFor="fb-db-id" className="block text-xs font-medium text-zinc-400 mb-1">
                    firestoreDatabaseId
                  </label>
                  <input
                    id="fb-db-id"
                    type="text"
                    value={fbForm.firestoreDatabaseId || ''}
                    onChange={(e) => setFbForm({ ...fbForm, firestoreDatabaseId: e.target.value })}
                    placeholder="(default)"
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-copper-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-white font-semibold text-xs border border-zinc-700 transition-colors"
                >
                  Aplicar firebaseConfig
                </button>
                <button
                  type="button"
                  onClick={onResetFirebaseConfig}
                  className="py-2.5 px-4 rounded-xl bg-obsidian-950 hover:bg-obsidian-850 text-zinc-300 font-medium text-xs border border-zinc-800 inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="font-display font-bold text-base text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Bunny Stream · PixGo · Telegram Bot</span>
            </h2>

            <form onSubmit={handleSaveIntegrationSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cfg-bunny-lib" className="block text-xs font-medium text-zinc-400 mb-1">
                    Bunny Stream Library ID
                  </label>
                  <input
                    id="cfg-bunny-lib"
                    type="text"
                    value={intForm.bunnyLibId}
                    onChange={(e) => setIntForm({ ...intForm, bunnyLibId: e.target.value })}
                    placeholder="Ex: 294810"
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
                  />
                </div>
                <div>
                  <label htmlFor="cfg-pixgold-key" className="block text-xs font-medium text-zinc-400 mb-1">
                    PixGo API Key / Carteira
                  </label>
                  <input
                    id="cfg-pixgold-key"
                    type="password"
                    value={intForm.pixGoldKey}
                    onChange={(e) => setIntForm({ ...intForm, pixGoldKey: e.target.value })}
                    placeholder="pg_live_..."
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cfg-tg-token" className="block text-xs font-medium text-zinc-400 mb-1">
                    Telegram Bot Token (@BotFather)
                  </label>
                  <input
                    id="cfg-tg-token"
                    type="password"
                    value={intForm.tgBotToken}
                    onChange={(e) => setIntForm({ ...intForm, tgBotToken: e.target.value })}
                    placeholder="7123456789:AAH..."
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
                  />
                </div>
                <div>
                  <label htmlFor="cfg-tg-chatid" className="block text-xs font-medium text-zinc-400 mb-1">
                    Chat ID da Ruivinha (Alertas)
                  </label>
                  <input
                    id="cfg-tg-chatid"
                    type="text"
                    value={intForm.tgChatId}
                    onChange={(e) => setIntForm({ ...intForm, tgChatId: e.target.value })}
                    placeholder="Ex: 987654321"
                    className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-white font-semibold text-xs border border-zinc-700 transition-colors"
              >
                Salvar Integrações Externas
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-5 sm:p-6">
          <h3 className="font-display font-bold text-base text-white mb-4">
            Histórico Recente · PixGo &amp; Webhook Telegram
          </h3>
          {transactions.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 border-t border-zinc-800/70">
              Nenhuma transação registrada ainda. Faça login e teste clicando em Assinar VIP ou Agendar Videochamada.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800/70 border-t border-zinc-800/70">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="text-white font-semibold">{tx.client}</span>
                    <span className="text-zinc-400"> · {tx.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 tabular-nums">
                    <span className="text-emerald-400 font-bold">{formatBRL(tx.amount)}</span>
                    <span className="text-zinc-500">{tx.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-5 sm:p-6">
          <h3 className="font-display font-bold text-base text-white mb-4">
            Gerenciar Publicações ({posts.length})
          </h3>
          <div className="divide-y divide-zinc-800/70 border-t border-zinc-800/70">
            {posts.map((post) => (
              <div
                key={post.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="text-zinc-200 font-medium truncate">{post.caption}</p>
                  <p className="text-zinc-500 mt-0.5">
                    {post.mediaType === 'video' ? 'Vídeo' : 'Foto'} · {post.accessType.toUpperCase()} · {post.createdAt}
                    {post.isSeed ? ' · Modelo inicial' : ' · Firestore'}
                  </p>
                </div>
                {!post.isSeed && (
                  <button
                    type="button"
                    onClick={() => onDeletePost(post.id)}
                    title="Remover publicação do Firestore"
                    aria-label="Remover publicação"
                    className="p-2 rounded-lg text-zinc-400 hover:text-rosegold-400 hover:bg-obsidian-800 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
