import React, { useState } from 'react';
import { Check, Heart, Lock, Maximize2, Pause, Play, ShieldCheck, Unlock } from 'lucide-react';
import type { FeedFilter, Post } from '../types';
import { formatBRL } from '../data/initialData';
import { CreatorAvatar } from './CreatorAvatar';
import { SafeImage } from './SafeImage';

interface FeedViewProps {
  posts: Post[];
  activeFilter: FeedFilter;
  onChangeFilter: (filter: FeedFilter) => void;
  isVipSubscriber: boolean;
  unlockedPostIds: string[];
  likedPostIds: string[];
  bunnyLibId: string;
  onLikePost: (postId: string) => void;
  onOpenCheckout: (kind: 'subscription' | 'ppv', postId?: string) => void;
  onOpenLightbox: (src: string, caption: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  activeFilter,
  onChangeFilter,
  isVipSubscriber,
  unlockedPostIds,
  likedPostIds,
  bunnyLibId,
  onLikePost,
  onOpenCheckout,
  onOpenLightbox,
}) => {
  const [playingDemoId, setPlayingDemoId] = useState<string | null>(null);

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === 'all') return true;
    return post.accessType === activeFilter;
  });

  const filterOptions: { id: FeedFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'vip', label: 'Assinatura VIP' },
    { id: 'ppv', label: 'Avulsos (PPV)' },
  ];

  return (
    <section className="pt-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-obsidian-900 border border-zinc-800/80 self-start"
          role="group"
          aria-label="Filtrar publicações"
        >
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChangeFilter(option.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 ${
                  isActive
                    ? 'bg-copper-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Streaming protegido via Bunny Stream</span>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="py-16 text-center bg-obsidian-900 border border-zinc-800/80 rounded-2xl">
          <p className="text-sm text-zinc-400">Nenhum post encontrado nesta categoria.</p>
          <button
            type="button"
            onClick={() => onChangeFilter('all')}
            className="mt-3 text-xs font-semibold text-copper-400 hover:text-copper-300 transition-colors"
          >
            Mostrar todos os posts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {filteredPosts.map((post) => {
            const isUnlocked =
              post.accessType === 'free' ||
              (post.accessType === 'vip' && isVipSubscriber) ||
              (post.accessType === 'ppv' && (unlockedPostIds.includes(post.id) || isVipSubscriber));

            const isLiked = likedPostIds.includes(post.id);
            const hasRealBunnyStream =
              Boolean(bunnyLibId.trim()) &&
              Boolean(post.bunnyVideoId.trim()) &&
              !post.bunnyVideoId.startsWith('demo-');

            const accessLabel =
              post.accessType === 'free'
                ? 'Prévia Gratuita'
                : post.accessType === 'vip'
                  ? 'Assinatura VIP'
                  : `Avulso PPV · ${formatBRL(post.price)}`;

            const accessTone =
              post.accessType === 'free'
                ? 'text-emerald-400'
                : post.accessType === 'vip'
                  ? 'text-copper-400'
                  : 'text-rosegold-400';

            const isDemoPlaying = playingDemoId === post.id;

            return (
              <article
                key={post.id}
                className="bg-obsidian-900 border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CreatorAvatar size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-sm text-white truncate">
                          Ruivinha VIP
                        </span>
                        <span
                          className="w-4 h-4 rounded-full bg-copper-600 text-white inline-flex items-center justify-center shrink-0"
                          title="Criadora Verificada"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate tabular-nums">
                        <span className={`font-medium ${accessTone}`}>{accessLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <p className="text-sm text-zinc-200 leading-relaxed">{post.caption}</p>
                </div>

                {isUnlocked ? (
                  post.mediaType === 'video' ? (
                    hasRealBunnyStream ? (
                      <div className="relative aspect-video w-full bg-black">
                        <iframe
                          src={`https://iframe.mediadelivery.net/embed/${encodeURIComponent(bunnyLibId.trim())}/${encodeURIComponent(post.bunnyVideoId.trim())}?autoplay=false&preload=true`}
                          loading="lazy"
                          title={post.caption}
                          className="w-full h-full border-0"
                          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-video w-full bg-obsidian-950 overflow-hidden group">
                        <SafeImage
                          src={post.thumbUrl}
                          alt={post.caption}
                          fallbackLabel="Vídeo VIP Liberado"
                          className={`w-full h-full object-cover transition-transform duration-500 ${
                            isDemoPlaying ? 'scale-105 opacity-95' : 'opacity-80'
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25 flex flex-col justify-between p-4">
                          <div className="flex items-center justify-between text-xs text-zinc-200">
                            <span className="font-mono text-[11px] bg-black/60 px-2.5 py-1 rounded-md">
                              {post.bunnyVideoId || 'player-vip'}
                            </span>
                            {isDemoPlaying && (
                              <span className="text-xs font-semibold text-copper-400 bg-black/60 px-2.5 py-1 rounded-md">
                                Reproduzindo prévia HD
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPlayingDemoId(isDemoPlaying ? null : post.id)
                              }
                              aria-label={isDemoPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                              className="w-14 h-14 rounded-full ruiva-gradient flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-transform"
                            >
                              {isDemoPlaying ? (
                                <Pause className="w-6 h-6 fill-current" />
                              ) : (
                                <Play className="w-6 h-6 fill-current ml-0.5" />
                              )}
                            </button>
                            <span className="text-xs font-medium text-zinc-200">
                              {isDemoPlaying
                                ? 'Streaming simulado ativo · Configure o Library ID no Admin para embed real'
                                : 'Clique para reproduzir · Bunny Stream pronto'}
                            </span>
                          </div>

                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ruiva-gradient transition-all duration-700 ${
                                isDemoPlaying ? 'w-2/3' : 'w-1/12'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenLightbox(post.thumbUrl, post.caption)}
                      className="relative aspect-[4/3] w-full bg-obsidian-950 overflow-hidden group text-left"
                    >
                      <SafeImage
                        src={post.thumbUrl}
                        alt={post.caption}
                        fallbackLabel="Foto Exclusiva VIP"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 text-xs font-medium text-white opacity-90 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Ampliar</span>
                      </span>
                    </button>
                  )
                ) : (
                  <div className="relative aspect-[4/3] w-full bg-obsidian-950 overflow-hidden select-none">
                    <SafeImage
                      src={post.thumbUrl}
                      alt="Conteúdo exclusivo bloqueado"
                      fallbackLabel="Conteúdo Protegido"
                      className="w-full h-full object-cover blur-2xl scale-110 opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/95 via-obsidian-950/65 to-obsidian-950/75 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-obsidian-900 border border-zinc-700/80 flex items-center justify-center text-copper-400 mb-3">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg text-white mb-1">
                        {post.mediaType === 'video'
                          ? 'Vídeo Exclusivo Bloqueado'
                          : 'Ensaio Privado Bloqueado'}
                      </h3>
                      <p className="text-xs text-zinc-300 max-w-xs mb-4 leading-relaxed">
                        Liberação instantânea no site e envio automático pelo Bot no Telegram após o Pix.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          post.accessType === 'vip'
                            ? onOpenCheckout('subscription')
                            : onOpenCheckout('ppv', post.id)
                        }
                        className="px-5 py-2.5 rounded-xl ruiva-gradient text-white font-bold text-xs sm:text-sm whitespace-nowrap shrink-0 hover:opacity-95 active:scale-[0.98] transition-all"
                      >
                        {post.accessType === 'vip'
                          ? 'Assinar VIP · R$ 49,90/mês'
                          : `Desbloquear por ${formatBRL(post.price)}`}
                      </button>
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
                  <button
                    type="button"
                    onClick={() => onLikePost(post.id)}
                    className={`inline-flex items-center gap-1.5 font-medium transition-colors tabular-nums ${
                      isLiked ? 'text-rosegold-400' : 'text-zinc-400 hover:text-rosegold-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likes} curtidas</span>
                  </button>

                  <span className="inline-flex items-center gap-1.5 text-zinc-400">
                    {isUnlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Liberado</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Protegido</span>
                      </>
                    )}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
