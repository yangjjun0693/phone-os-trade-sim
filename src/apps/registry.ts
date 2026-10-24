import {
  Globe,
  Mail,
  MessageCircle,
  MessagesSquare,
  Settings,
  StickyNote,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import type { AppMeta } from '@/types';
import { BrowserApp } from './browser/BrowserApp';
import { ContactsApp } from './contacts/ContactsApp';
import { ForumApp } from './forum/ForumApp';
import { MailApp } from './mail/MailApp';
import { MessagesApp } from './messages/MessagesApp';
import { NotesApp } from './notes/NotesApp';
import { SettingsApp } from './settings/SettingsApp';
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
    icon: TrendingUp,
    gradient: ['#22d3ee', '#2563eb'],
    Component: TradeApp,
  },
  messages: {
    id: 'messages',
    name: '메시지',
    icon: MessageCircle,
    gradient: ['#5bf675', '#12b53c'],
    Component: MessagesApp,
  },
  browser: {
    id: 'browser',
    name: '브라우저',
    icon: Globe,
    gradient: ['#38bdf8', '#1d4ed8'],
    Component: BrowserApp,
  },
  wallet: {
    id: 'wallet',
    name: '지갑',
    icon: Wallet,
    gradient: ['#3a3a3c', '#1c1c1e'],
    Component: WalletApp,
  },
  notes: {
    id: 'notes',
    name: '메모',
    icon: StickyNote,
    gradient: ['#fde047', '#f59e0b'],
    Component: NotesApp,
  },
  settings: {
    id: 'settings',
    name: '설정',
    icon: Settings,
    gradient: ['#b6bcc6', '#4b5563'],
    Component: SettingsApp,
  },
  mail: {
    id: 'mail',
    name: '메일',
    icon: Mail,
    gradient: ['#60a5fa', '#2563eb'],
    Component: MailApp,
  },
  forum: {
    id: 'forum',
    name: '포럼',
    icon: MessagesSquare,
    gradient: ['#a78bfa', '#7c3aed'],
    Component: ForumApp,
  },
  contacts: {
    id: 'contacts',
    name: '연락처',
    icon: Users,
    gradient: ['#f472b6', '#db2777'],
    Component: ContactsApp,
  },
};

export const apps: AppMeta[] = Object.values(APP_REGISTRY);

export function getApp(appId: string | null | undefined): AppMeta | null {
  if (!appId) return null;
  return APP_REGISTRY[appId] ?? null;
}
