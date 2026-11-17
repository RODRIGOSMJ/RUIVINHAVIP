import type { CallPackage, Post } from '../types';
import coverBackdropImg from '../assets/images/vip_cover_backdrop_1794879199000.jpg';
import editorialPreviewImg from '../assets/images/editorial_preview_portrait_1794879199556.jpg';
import studioVipImg from '../assets/images/livestream_studio_vip_1794879200109.jpg';
import velvetSuiteImg from '../assets/images/velvet_suite_ppv_1794879200372.jpg';

export const COVER_BACKDROP_IMAGE = coverBackdropImg;
export const EDITORIAL_PREVIEW_IMAGE = editorialPreviewImg;
export const STUDIO_VIP_IMAGE = studioVipImg;
export const VELVET_SUITE_IMAGE = velvetSuiteImg;

export const PRESET_THUMBNAILS = [
  { label: 'Ensaio Estúdio Ruiva', url: EDITORIAL_PREVIEW_IMAGE },
  { label: 'Bastidores Live Studio', url: STUDIO_VIP_IMAGE },
  { label: 'Suíte Velvet Noturna', url: VELVET_SUITE_IMAGE },
  { label: 'Capa Editorial VIP', url: COVER_BACKDROP_IMAGE },
];

export const STORAGE_KEYS = {
  CONFIG: 'ruivinha_vip_api_config',
  POSTS: 'ruivinha_vip_posts',
  UNLOCKED: 'ruivinha_vip_unlocked_items',
  SUBSCRIPTION: 'ruivinha_vip_is_subscriber',
  LOGS: 'ruivinha_vip_tx_logs',
  LIKED_POSTS: 'ruivinha_vip_liked_posts',
} as const;

export const CALLS_AND_PACKAGES: CallPackage[] = [
  {
    id: 'call-15min',
    type: 'call',
    categoryLabel: 'Ao Vivo 1x1 · Telegram ou WhatsApp',
    title: 'Videochamada Privada · 15 Minutos',
    description:
      'Chamada exclusiva comigo pelo Telegram ou WhatsApp, sem interrupções. Assim que pagar, o Bot me avisa na hora para começarmos.',
    price: 89.9,
    highlight: true,
  },
  {
    id: 'call-30min',
    type: 'call',
    categoryLabel: 'Experiência Completa · Prioridade Máxima',
    title: 'Videochamada VIP · 30 Minutos',
    description:
      'Meia hora exclusiva para realizarmos suas fantasias ao vivo. Prioridade máxima na fila de atendimento.',
    price: 159.9,
    highlight: false,
  },
  {
    id: 'pack-superlive',
    type: 'pack',
    categoryLabel: 'Entrega Automática · 25 Fotos + 5 Vídeos',
    title: 'Pack Bastidores Superlive & Buskets',
    description:
      '25 fotos em alta resolução e 5 vídeos inéditos que não puderam ir ao ar nas lives. Link entregue na hora pelo Bot.',
    price: 39.9,
    highlight: false,
  },
  {
    id: 'pack-ensaio-ruiva',
    type: 'pack',
    categoryLabel: 'Mais Vendido · Acesso Vitalício',
    title: 'Ensaio Completo Ruivinha Sem Censura',
    description:
      'Vídeo longo (18 min em Full HD) com álbum completo sem cortes. Acesso vitalício enviado direto no seu Telegram.',
    price: 59.9,
    highlight: false,
  },
];

export const DEFAULT_POSTS: Post[] = [
  {
    id: 'post-1',
    createdAt: 'Hoje · 21:15',
    caption:
      'Acabei de sair da live na Superlive e separei esse clique exclusivo dos bastidores para vocês. Quem aí já garante o acesso VIP?',
    mediaType: 'photo',
    accessType: 'free',
    price: 0,
    thumbUrl: EDITORIAL_PREVIEW_IMAGE,
    bunnyVideoId: '',
    likes: 342,
  },
  {
    id: 'post-2',
    createdAt: 'Ontem · 23:40',
    caption:
      'Gravação completa pós-live sem cortes (12 min em 4K). Disponível imediatamente para assinantes do Clube Ruivinha VIP.',
    mediaType: 'video',
    accessType: 'vip',
    price: 49.9,
    thumbUrl: STUDIO_VIP_IMAGE,
    bunnyVideoId: 'demo-video-vip-01',
    likes: 518,
  },
  {
    id: 'post-3',
    createdAt: 'Há 2 dias · 22:10',
    caption:
      'Conteúdo Avulso Especial (PPV): o vídeo mais pedido desta semana na Buskets com liberação instantânea no player após o Pix.',
    mediaType: 'video',
    accessType: 'ppv',
    price: 29.9,
    thumbUrl: VELVET_SUITE_IMAGE,
    bunnyVideoId: 'demo-video-ppv-02',
    likes: 429,
  },
];

export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}
