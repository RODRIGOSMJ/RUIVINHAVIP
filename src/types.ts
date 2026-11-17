export type MediaType = 'video' | 'photo';
export type AccessType = 'free' | 'vip' | 'ppv';
export type TabId = 'feed' | 'calls' | 'admin';
export type FeedFilter = 'all' | 'vip' | 'ppv';

export interface Post {
  id: string;
  createdAt: string;
  caption: string;
  mediaType: MediaType;
  accessType: AccessType;
  price: number;
  thumbUrl: string;
  bunnyVideoId: string;
  likes: number;
}

export interface CallPackage {
  id: string;
  type: 'call' | 'pack';
  categoryLabel: string;
  title: string;
  description: string;
  price: number;
  highlight: boolean;
}

export interface ApiConfig {
  supabaseUrl: string;
  supabaseKey: string;
  bunnyLibId: string;
  pixGoldKey: string;
  tgBotToken: string;
  tgChatId: string;
}

export interface TransactionLog {
  id: string;
  time: string;
  client: string;
  title: string;
  amount: number;
}

export interface CheckoutItem {
  kind: 'subscription' | 'ppv' | 'call' | 'pack';
  id: string;
  title: string;
  price: number;
  telegramUser?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface UserAccount {
  email: string;
  isDemo?: boolean;
}
