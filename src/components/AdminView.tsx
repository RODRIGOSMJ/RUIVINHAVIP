import React, { useState } from 'react';
import { KeyRound, Plus, RotateCcw, Send, Trash2 } from 'lucide-react';
import type { AccessType, ApiConfig, MediaType, Post, TransactionLog } from '../types';
import { EDITORIAL_PREVIEW_IMAGE, PRESET_THUMBNAILS, formatBRL } from '../data/initialData';

interface AdminViewProps {
  config: ApiConfig;
  posts: Post[];
  transactions: TransactionLog[];
  onSaveConfig: (nextConfig: ApiConfig) => void;
  onCreatePost: (post: Omit<Post, 'id' | 'createdAt' | 'likes'>) => void;
  onDeletePost: (postId: string) => void;
  onResetDemo: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  config,
  posts,
  transactions,
  onSaveConfig,
  onCreatePost,
  onDeletePost,
  onResetDemo,
}) => {
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [accessType, setAccessType] = useState<AccessType>('vip');
  const [bunnyVideoId, setBunnyVideoId] = useState('');
  const [thumbUrl, setThumbUrl] = useState(EDITORIAL_PREVIEW_IMAGE);
  const [price, setPrice] = useState('29.90');

  const [formConfig, setFormConfig] = useState<ApiConfig>(config);

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;

    onCreatePost({
      caption: caption.trim(),
      mediaType,
      accessType,
      price: accessType === 'ppv' ? parseFloat(price || '29.90') : 0,
      thumbUrl: thumbUrl.trim() || EDITORIAL_PREVIEW_IMAGE,
      bunnyVideoId: bunnyVideoId.trim(),
    });

    setCaption('');
    setBunnyVideoId('');
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      supabaseUrl: formConfig.supabaseUrl.trim(),
      supabaseKey: formConfig.supabaseKey.trim(),
      bunnyLibId: formConfig.bunnyLibId.trim(),
      pixGoldKey: formConfig.pixGoldKey.trim(),
      tgBotToken: formConfig.tgBotToken.trim(),
      tgChatId: formConfig.tgChatId.trim(),
    });
  };

  return (
    <section className="pt-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-copper-400" />
              <span>Publicar Novo Post no Feed</span>
            </h2>
            <span className="text-xs text-zinc-400">Bunny Stream · Feed</span>
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
                  <option value="video">Vídeo (Bunny Stream ID)</option>
                  <option value="photo">Foto Exclusiva</option>
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

            {mediaType === 'video' && (
              <div>
                <label htmlFor="post-bunny-id" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Bunny Stream Video ID (GUID)
                </label>
                <input
                  id="post-bunny-id"
                  type="text"
                  value={bunnyVideoId}
                  onChange={(e) => setBunnyVideoId(e.target.value)}
                  placeholder="Ex: 8a4f92c1-7b3d-4e1a-9c2f-123456789abc"
                  className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Suba o vídeo no painel Bunny Stream e cole o Video ID aqui.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="post-thumb-url" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Capa / Foto (Preset local ou URL)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_THUMBNAILS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setThumbUrl(preset.url)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      thumbUrl === preset.url
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
                placeholder="/src/assets/images/..."
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
              className="w-full py-3 px-4 rounded-xl ruiva-gradient text-white font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              <Send className="w-4 h-4" />
              <span>Publicar Conteúdo Agora</span>
            </button>
          </form>
        </div>

        <div className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <span>Conexões &amp; Chaves de API</span>
            </h2>
            <span className="text-xs text-emerald-400 font-medium">Salvo localmente</span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Conecte seu projeto Supabase para ativar o Login com Google real e informe seu Bunny Stream Library ID para incorporar seus vídeos privados diretamente no Feed.
          </p>

          <form onSubmit={handleConfigSubmit} className="space-y-3">
            <div>
              <label htmlFor="cfg-supabase-url" className="block text-xs font-medium text-zinc-400 mb-1">
                Supabase Project URL
              </label>
              <input
                id="cfg-supabase-url"
                type="url"
                value={formConfig.supabaseUrl}
                onChange={(e) => setFormConfig({ ...formConfig, supabaseUrl: e.target.value })}
                placeholder="https://seuprojeto.supabase.co"
                className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
              />
            </div>

            <div>
              <label htmlFor="cfg-supabase-key" className="block text-xs font-medium text-zinc-400 mb-1">
                Supabase Anon Public Key
              </label>
              <input
                id="cfg-supabase-key"
                type="password"
                value={formConfig.supabaseKey}
                onChange={(e) => setFormConfig({ ...formConfig, supabaseKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cfg-bunny-lib" className="block text-xs font-medium text-zinc-400 mb-1">
                  Bunny Stream Library ID
                </label>
                <input
                  id="cfg-bunny-lib"
                  type="text"
                  value={formConfig.bunnyLibId}
                  onChange={(e) => setFormConfig({ ...formConfig, bunnyLibId: e.target.value })}
                  placeholder="Ex: 294810"
                  className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
                />
              </div>

              <div>
                <label htmlFor="cfg-pixgold-key" className="block text-xs font-medium text-zinc-400 mb-1">
                  Pix Gold API Key / Carteira
                </label>
                <input
                  id="cfg-pixgold-key"
                  type="password"
                  value={formConfig.pixGoldKey}
                  onChange={(e) => setFormConfig({ ...formConfig, pixGoldKey: e.target.value })}
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
                  value={formConfig.tgBotToken}
                  onChange={(e) => setFormConfig({ ...formConfig, tgBotToken: e.target.value })}
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
                  value={formConfig.tgChatId}
                  onChange={(e) => setFormConfig({ ...formConfig, tgChatId: e.target.value })}
                  placeholder="Ex: 987654321"
                  className="w-full rounded-xl bg-obsidian-950 border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-copper-500"
                />
              </div>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-white font-semibold text-xs border border-zinc-700 transition-colors"
              >
                Salvar Configurações de Integração
              </button>
              <button
                type="button"
                onClick={onResetDemo}
                className="py-2.5 px-4 rounded-xl bg-obsidian-950 hover:bg-obsidian-850 text-zinc-300 font-medium text-xs border border-zinc-800 inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetar Demo</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl p-5 sm:p-6">
          <h3 className="font-display font-bold text-base text-white mb-4">
            Histórico Recente · Pix Gold &amp; Webhook Telegram
          </h3>
          {transactions.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4 border-t border-zinc-800/70">
              Nenhuma transação registrada ainda. Teste clicando em Assinar VIP ou Agendar Videochamada.
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
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeletePost(post.id)}
                  title="Remover publicação"
                  aria-label="Remover publicação"
                  className="p-2 rounded-lg text-zinc-400 hover:text-rosegold-400 hover:bg-obsidian-800 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
