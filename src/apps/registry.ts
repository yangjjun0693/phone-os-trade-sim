import { lazy, type ComponentType } from 'react';
import {
  BankIcon,
  ChromaIcon,
  DeliveryIcon,
  ContactsIcon,
  ExIcon,
  ForumIcon,
  GmallIcon,
  MapIcon,
  MessagesCallIcon,
  NewsIcon,
  NotesIcon,
  ProteanIcon,
  SailorIcon,
  SettingsIcon,
  ShadeIcon,
  SteakIcon,
  TelegraphIcon,
  TradeIcon,
  WalletIcon,
} from './icons';
import type { AppMeta } from '@/types';

type AppModule = Record<string, unknown>;

/**
 * Split an app into its own chunk while keeping the registry synchronous.
 *
 * The home screen only needs an app's metadata (name, icon, colours), so
 * importing the 19 app implementations eagerly made the first paint pay for
 * every screen in the OS. `preload` is called on pointer-down/hover so the
 * chunk is usually ready before the open animation finishes.
 */
function lazyApp(loadModule: () => Promise<AppModule>, exportName: string) {
  const load = () =>
    loadModule().then((module) => ({ default: module[exportName] as ComponentType }));
  return {
    Component: lazy(load) as unknown as ComponentType,
    preload: () => {
      void load().catch(() => {
        /* A failed preload is harmless: AppWindow will retry when opened. */
      });
    },
  };
}

/**
 * App registry.
 *
 * To add an app: create `apps/<name>/<Name>App.tsx` (component + a single
 * default export) and add one entry below. The home screen, dock and app
 * switcher all read from here — nothing else needs to change.
 */
export const APP_REGISTRY: Record<string, AppMeta> = {
  trade: {
    id: 'trade',
    name: '거래',
    accent: '#22d3ee',
    icon: TradeIcon,
    gradient: ['#22d3ee', '#2563eb'],
    ...lazyApp(() => import('./trade/TradeApp'), 'TradeApp'),
  },
  messagesCall: {
    id: 'messagesCall',
    name: '메시지/통화',
    accent: '#059669',
    icon: MessagesCallIcon,
    gradient: ['#34d399', '#059669'],
    ...lazyApp(() => import('./messenger/MessagesCallApp'), 'MessagesCallApp'),
  },
  chroma: {
    id: 'chroma',
    name: 'Chroma',
    accent: '#4285f4',
    icon: ChromaIcon,
    gradient: ['#f472b6', '#a855f7'],
    ...lazyApp(() => import('./browser/ChromaApp'), 'ChromaApp'),
  },
  sailor: {
    id: 'sailor',
    name: 'Sailor',
    accent: '#0ea5e9',
    icon: SailorIcon,
    gradient: ['#0ea5e9', '#0369a1'],
    ...lazyApp(() => import('./browser/SailorApp'), 'SailorApp'),
  },
  shade: {
    id: 'shade',
    name: 'Shade',
    accent: '#7d4698',
    icon: ShadeIcon,
    gradient: ['#64748b', '#1e293b'],
    ...lazyApp(() => import('./browser/ShadeApp'), 'ShadeApp'),
  },
  wallet: {
    id: 'wallet',
    name: '지갑',
    accent: '#6b7280',
    icon: WalletIcon,
    gradient: ['#3a3a3c', '#1c1c1e'],
    ...lazyApp(() => import('./wallet/WalletApp'), 'WalletApp'),
  },
  notes: {
    id: 'notes',
    name: '메모',
    accent: '#f59e0b',
    icon: NotesIcon,
    gradient: ['#fde047', '#f59e0b'],
    ...lazyApp(() => import('./notes/NotesApp'), 'NotesApp'),
  },
  settings: {
    id: 'settings',
    name: '설정',
    accent: '#6b7280',
    icon: SettingsIcon,
    gradient: ['#b6bcc6', '#4b5563'],
    ...lazyApp(() => import('./settings/SettingsApp'), 'SettingsApp'),
  },
  gmall: {
    id: 'gmall',
    name: 'Gmall',
    accent: '#2563eb',
    icon: GmallIcon,
    gradient: ['#60a5fa', '#2563eb'],
    ...lazyApp(() => import('./mail/GmailApp'), 'GmailApp'),
  },
  protean: {
    id: 'protean',
    name: 'Protean',
    accent: '#7c3aed',
    icon: ProteanIcon,
    gradient: ['#a78bfa', '#7c3aed'],
    ...lazyApp(() => import('./mail/ProteanApp'), 'ProteanApp'),
  },
  telegraph: {
    id: 'telegraph',
    name: 'Telegraph',
    accent: '#06b6d4',
    icon: TelegraphIcon,
    gradient: ['#22d3ee', '#06b6d4'],
    ...lazyApp(() => import('./messenger/TelegraphApp'), 'TelegraphApp'),
  },
  ex: {
    id: 'ex',
    name: 'Ex',
    accent: '#ec4899',
    icon: ExIcon,
    gradient: ['#f472b6', '#ec4899'],
    ...lazyApp(() => import('./messenger/ExApp'), 'ExApp'),
  },
  forum: {
    id: 'forum',
    name: '포럼',
    accent: '#8b5cf6',
    icon: ForumIcon,
    gradient: ['#a78bfa', '#7c3aed'],
    ...lazyApp(() => import('./forum/ForumApp'), 'ForumApp'),
  },
  contacts: {
    id: 'contacts',
    name: '연락처',
    accent: '#db2777',
    icon: ContactsIcon,
    gradient: ['#f472b6', '#db2777'],
    ...lazyApp(() => import('./contacts/ContactsApp'), 'ContactsApp'),
  },
  bank: {
    id: 'bank',
    name: '초콜렛뱅크',
    accent: '#ca8a04',
    icon: BankIcon,
    gradient: ['#ffe300', '#ffd600'],
    ...lazyApp(() => import('./bank/BankApp'), 'BankApp'),
  },
  news: {
    id: 'news',
    name: '초선일보',
    accent: '#dc2626',
    icon: NewsIcon,
    gradient: ['#ffffff', '#f4f4f5'],
    ...lazyApp(() => import('./news/NewsApp'), 'NewsApp'),
  },
  delivery: {
    id: 'delivery',
    name: '구팡',
    accent: '#f97316',
    icon: DeliveryIcon,
    gradient: ['#fdfdfd', '#ededee'],
    ...lazyApp(() => import('./delivery/DeliveryApp'), 'DeliveryApp'),
  },
  map: {
    id: 'map',
    name: 'Maps',
    accent: '#16a34a',
    icon: MapIcon,
    gradient: ['#55d06a', '#2f7ff0'],
    ...lazyApp(() => import('./map/MapApp'), 'MapApp'),
  },
  steak: {
    id: 'steak',
    name: 'steak',
    accent: '#00e701',
    icon: SteakIcon,
    gradient: ['#16394d', '#081923'],
    ...lazyApp(() => import('./steak/SteakApp'), 'SteakApp'),
  },
};

export const apps: AppMeta[] = Object.values(APP_REGISTRY);

export function getApp(appId: string | null | undefined): AppMeta | null {
  if (!appId) return null;
  return APP_REGISTRY[appId] ?? null;
}
