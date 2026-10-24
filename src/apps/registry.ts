import {
  ChromaIcon,
  ContactsIcon,
  ExIcon,
  ForumIcon,
  GmallIcon,
  MailIcon,
  MessagesCallIcon,
  MessagesIcon,
  NotesIcon,
  ProteanIcon,
  SailorIcon,
  SettingsIcon,
  ShadeIcon,
  TelegraphIcon,
  TradeIcon,
  WalletIcon,
} from './icons';
import type { AppMeta } from '@/types';
import { BrowserApp } from './browser/BrowserApp';
import { ChromaApp } from './browser/ChromaApp';
import { ContactsApp } from './contacts/ContactsApp';
import { ExApp } from './messenger/ExApp';
import { ForumApp } from './forum/ForumApp';
import { GmailApp } from './mail/GmailApp';
import { MessagesApp } from './messages/MessagesApp';
import { MessagesCallApp } from './messenger/MessagesCallApp';
import { NotesApp } from './notes/NotesApp';
import { ProteanApp } from './mail/ProteanApp';
import { SailorApp } from './browser/SailorApp';
import { SettingsApp } from './settings/SettingsApp';
import { ShadeApp } from './browser/ShadeApp';
import { TelegraphApp } from './messenger/TelegraphApp';
import { TradeApp } from './trade/TradeApp';
import { WalletApp } from './wallet/WalletApp';

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
    icon: TradeIcon,
    gradient: ['#22d3ee', '#2563eb'],
    Component: TradeApp,
  },
  messages: {
    id: 'messages',
    name: '메시지',
    icon: MessagesIcon,
    gradient: ['#5bf675', '#12b53c'],
    Component: MessagesApp,
  },
  messagesCall: {
    id: 'messagesCall',
    name: '메시지/통화',
    icon: MessagesCallIcon,
    gradient: ['#34d399', '#059669'],
    Component: MessagesCallApp,
  },
  chroma: {
    id: 'chroma',
    name: 'Chroma',
    icon: ChromaIcon,
    gradient: ['#f472b6', '#a855f7'],
    Component: ChromaApp,
  },
  sailor: {
    id: 'sailor',
    name: 'Sailor',
    icon: SailorIcon,
    gradient: ['#0ea5e9', '#0369a1'],
    Component: SailorApp,
  },
  shade: {
    id: 'shade',
    name: 'Shade',
    icon: ShadeIcon,
    gradient: ['#64748b', '#1e293b'],
    Component: ShadeApp,
  },
  wallet: {
    id: 'wallet',
    name: '지갑',
    icon: WalletIcon,
    gradient: ['#3a3a3c', '#1c1c1e'],
    Component: WalletApp,
  },
  notes: {
    id: 'notes',
    name: '메모',
    icon: NotesIcon,
    gradient: ['#fde047', '#f59e0b'],
    Component: NotesApp,
  },
  settings: {
    id: 'settings',
    name: '설정',
    icon: SettingsIcon,
    gradient: ['#b6bcc6', '#4b5563'],
    Component: SettingsApp,
  },
  gmall: {
    id: 'gmall',
    name: 'Gmall',
    icon: GmallIcon,
    gradient: ['#60a5fa', '#2563eb'],
    Component: GmailApp,
  },
  protean: {
    id: 'protean',
    name: 'Protean',
    icon: ProteanIcon,
    gradient: ['#a78bfa', '#7c3aed'],
    Component: ProteanApp,
  },
  telegraph: {
    id: 'telegraph',
    name: 'Telegraph',
    icon: TelegraphIcon,
    gradient: ['#22d3ee', '#06b6d4'],
    Component: TelegraphApp,
  },
  ex: {
    id: 'ex',
    name: 'Ex',
    icon: ExIcon,
    gradient: ['#f472b6', '#ec4899'],
    Component: ExApp,
  },
  forum: {
    id: 'forum',
    name: '포럼',
    icon: ForumIcon,
    gradient: ['#a78bfa', '#7c3aed'],
    Component: ForumApp,
  },
  contacts: {
    id: 'contacts',
    name: '연락처',
    icon: ContactsIcon,
    gradient: ['#f472b6', '#db2777'],
    Component: ContactsApp,
  },
};

export const apps: AppMeta[] = Object.values(APP_REGISTRY);

export function getApp(appId: string | null | undefined): AppMeta | null {
  if (!appId) return null;
  return APP_REGISTRY[appId] ?? null;
}
