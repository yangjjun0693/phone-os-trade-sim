import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, Star, Send, FileText, AlertTriangle, Trash2,
  Search, Filter, ChevronRight, Mail as MailIcon,
  Check, Star as StarIcon, MoreVertical, Reply, Forward,
  Archive, Trash, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GMAIL_MESSAGES, GMAIL_FOLDERS, type MailMessage, type MailFolder } from './MailTypes';
import { Pill } from '@/components';
import { AppShell } from '../AppShell';
import { PhishingMails } from './PhishingMails';
import { HamburgerButton, SideDrawer } from '../SideDrawer';
import { SPRING_SNAPPY, SPRING_SOFT, prefersReducedMotion } from '@/utils/motion';
import { cn } from '@/utils/cn';

const FOLDER_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  inbox: Inbox,
  starred: Star,
  sent: Send,
  drafts: FileText,
  spam: AlertTriangle,
  trash: Trash2,
};

export function GmailApp() {
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'comfortable'>('list');
  const [openMessage, setOpenMessage] = useState<MailMessage | null>(null);
  const gameDateTime = useGameStore(s => s.gameDateTime);

  const folder = GMAIL_FOLDERS.find(f => f.id === selectedFolder);
  const messages = useMemo(() => {
    let msgs = GMAIL_MESSAGES;
    if (selectedFolder === 'starred') msgs = msgs.filter(m => m.starred);
    if (selectedFolder === 'sent') return []; // Mock
    if (selectedFolder === 'drafts') return []; // Mock
    if (selectedFolder === 'spam') return []; // Mock
    if (selectedFolder === 'trash') return []; // Mock
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      msgs = msgs.filter(m =>
        m.subject.toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q)
      );
    }
    return msgs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedFolder, searchQuery]);

  const unreadCount = messages.filter(m => !m.read).length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map(m => m.id)));
    }
  };

  const markAsRead = (read: boolean) => {
    selectedIds.forEach(id => {
      const msg = GMAIL_MESSAGES.find(m => m.id === id);
      if (msg) msg.read = read;
    });
    setSelectedIds(new Set());
    // Force re-render
    setSearchQuery(q => q);
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = GMAIL_MESSAGES.find(m => m.id === id);
    if (msg) msg.starred = !msg.starred;
    setSearchQuery(q => q);
  };

  const handleMessageClick = (msg: MailMessage) => {
    if (!msg.read) {
      msg.read = true;
      setSearchQuery(q => q);
    }
    setOpenMessage(msg);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date(gameDateTime);
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const reduced = prefersReducedMotion();

  // Sidebar
  const sidebar = (
    <div className="flex flex-col h-full border-r border-ios-separator/20 bg-ios-bg">
      {/* Search */}
      <div className="p-3 border-b border-ios-separator/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ios-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="메일 검색"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-ios-surface text-[14px] text-ios-text placeholder:text-ios-muted focus:outline-none focus:ring-2 focus:ring-ios-accent/20"
          />
        </div>
      </div>

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" role="navigation" aria-label="메일함">
        {GMAIL_FOLDERS.map(f => {
          const Icon = FOLDER_ICONS[f.id] || Inbox;
          const isActive = selectedFolder === f.id;
          return (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFolder(f.id);
                setDrawerOpen(false);
                setSelectedIds(new Set());
                setOpenMessage(null);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors',
                isActive
                  ? 'bg-ios-accent/15 text-ios-accent'
                  : 'text-ios-muted'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="truncate flex-1">{f.name}</span>
              {f.count > 0 && (
                <span className={cn(
                  'shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full',
                  isActive ? 'bg-ios-accent/20 text-ios-accent' : 'bg-ios-separator/20 text-ios-muted'
                )}>
                  {f.count > 99 ? '99+' : f.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Identity badge */}
      <div className="p-3 border-t border-ios-separator/20">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ios-green/10">
          <MailIcon className="size-4 text-ios-green" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-ios-green">실명 신원 (Gmall)</p>
            <p className="text-[11px] text-ios-muted">은행, 쇼핑, 가족 메일 수신</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Message list
  const messageList = (
    <div className="flex-1 overflow-y-auto">
      {/* 수상한 메일: 열면 손해, 무시하면 그만. */}
      <PhishingMails />

      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-ios-muted">
          <p className="text-[14px]">메일이 없습니다</p>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {messages.map(msg => (
            <MessageRow
              key={msg.id}
              msg={msg}
              selected={selectedIds.has(msg.id)}
              onClick={() => handleMessageClick(msg)}
              onSelect={toggleSelect}
              onStar={toggleStar}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Toolbar
  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < messages.length;
    }
  }, [selectedIds.size, messages.length]);

  const toolbar = (
    <div className="flex items-center justify-between px-3 py-2 border-b border-ios-separator/20">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={selectedIds.size === messages.length && messages.length > 0}
            onChange={toggleSelectAll}
            className="size-4 accent-ios-accent"
            aria-label="전체 선택"
          />
          <span className="text-[13px] text-ios-muted">
            {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : '전체 선택'}
          </span>
        </label>
      </div>
      <div className="flex items-center gap-1">
        {selectedIds.size > 0 && (
          <>
            <button
              onClick={() => markAsRead(true)}
              className="p-2 rounded-xl text-ios-muted"
              aria-label="읽음으로 표시"
            >
              <ToggleLeft className="size-4" />
            </button>
            <button
              onClick={() => markAsRead(false)}
              className="p-2 rounded-xl text-ios-muted"
              aria-label="안 읽음으로 표시"
            >
              <ToggleRight className="size-4" />
            </button>
            <button
              onClick={() => { /* Archive */ }}
              className="p-2 rounded-xl text-ios-muted"
              aria-label="보관"
            >
              <Archive className="size-4" />
            </button>
            <button
              onClick={() => { /* Delete */ }}
              className="p-2 rounded-xl text-ios-muted"
              aria-label="삭제"
            >
              <Trash className="size-4" />
            </button>
            <button
              onClick={() => { /* More */ }}
              className="p-2 rounded-xl text-ios-muted"
              aria-label="더보기"
            >
              <MoreVertical className="size-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <AppShell
      title="Gmall"
      largeTitle={false}
      leading={<HamburgerButton onClick={() => setDrawerOpen(true)} open={drawerOpen} label="메일함 열기" />}
      className="flex flex-col"
      trailing={
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode(v => v === 'list' ? 'comfortable' : 'list')}
            className="p-2 rounded-xl text-ios-muted"
            aria-label={viewMode === 'list' ? '편안한 보기' : '목록 보기'}
          >
            {viewMode === 'list' ? (
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="5" rx="1" />
                <rect x="3" y="11" width="18" height="5" rx="1" />
                <rect x="3" y="19" width="18" height="5" rx="1" />
              </svg>
            ) : (
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
            )}
          </button>
          <button
            className="p-2 rounded-xl text-ios-muted"
            aria-label="새 메일 작성"
            disabled
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </button>
        </div>
      }
    >
      <div className="relative flex h-full min-h-0 overflow-hidden">
        <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} label="메일함">
          {sidebar}
        </SideDrawer>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col">
          {selectedIds.size > 0 ? toolbar : null}

          <AnimatePresence mode="wait">
            {openMessage ? (
              <MessageView
                key={openMessage.id}
                msg={openMessage}
                onClose={() => setOpenMessage(null)}
                onReply={() => { /* Reply */ }}
                onForward={() => { /* Forward */ }}
              />
            ) : (
              <div key="list" className="flex-1 flex flex-col">
                {messageList}
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </AppShell>
  );
}

function MessageRow({
  msg,
  selected,
  onClick,
  onSelect,
  onStar,
  formatDate,
}: {
  msg: MailMessage;
  selected: boolean;
  onClick: () => void;
  onSelect: (id: string) => void;
  onStar: (id: string, e: React.MouseEvent) => void;
  formatDate: (date: string) => string;
}) {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      layout
      initial={reduced ? undefined : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: 20 }}
      transition={SPRING_SNAPPY}
      onClick={onClick}
      onDoubleClick={e => { e.stopPropagation(); onSelect(msg.id); }}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors',
        selected ? 'bg-ios-accent/15 ring-1 ring-ios-accent/30' :
        msg.read ? '' : 'bg-ios-surface/50'
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(msg.id)}
        onClick={e => e.stopPropagation()}
        className="size-4 accent-ios-accent shrink-0"
        aria-label="선택"
      />
      <motion.button
        onClick={e => onStar(msg.id, e)}
        whileTap={{ scale: 0.8 }}
        className="p-1 rounded text-ios-muted shrink-0"
        aria-label={msg.starred ? '별표 제거' : '별표 추가'}
        aria-pressed={msg.starred}
      >
        <motion.span
          animate={msg.starred ? { scale: [1, 1.4, 1], rotate: [0, 18, 0] } : { scale: 1, rotate: 0 }}
          transition={SPRING_SNAPPY}
          className="flex"
        >
          <StarIcon className={cn('size-4', msg.starred ? 'fill-current text-ios-yellow' : '')} />
        </motion.span>
      </motion.button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('flex-1 truncate text-[15px]', msg.read ? 'font-medium text-ios-text' : 'font-semibold text-ios-text')}>
            {msg.from}
          </span>
          {msg.attachments > 0 && (
            <span className="shrink-0 text-[11px] text-ios-muted">📎 {msg.attachments}</span>
          )}
          <span className={cn('shrink-0 text-[12px] tabular-nums', msg.read ? 'text-ios-muted' : 'font-medium text-ios-text')}>
            {formatDate(msg.date)}
          </span>
        </div>
        <p className={cn('mt-0.5 truncate text-[13px]', msg.read ? 'text-ios-muted' : 'font-medium text-ios-text')}>
          {msg.subject}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-ios-muted">{msg.preview}</p>
        {msg.labels.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {msg.labels.slice(0, 3).map(label => (
              <Pill key={label} tone="neutral" className="text-[10px]">
                {label}
              </Pill>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MessageView({
  msg,
  onClose,
  onReply,
  onForward,
}: {
  msg: MailMessage;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
}) {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: 50 }}
      transition={SPRING_SOFT}
      className="flex h-full flex-col"
    >
      {/* Message header */}
      <div className="glass-strong sticky top-0 z-10 flex flex-col gap-3 border-b border-ios-separator/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="p-2 rounded-xl text-ios-muted" aria-label="뒤로">
            <ChevronRight className="size-5" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-[17px] font-semibold truncate">{msg.subject}</h1>
          </div>
          <div className="flex items-center gap-1" style={{ width: 44 }} />
        </div>

        <div className="flex items-start gap-3 text-[13px]">
          <div className="size-8 shrink-0 rounded-full bg-ios-accent/20 flex items-center justify-center">
            <MailIcon className="size-4 text-ios-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{msg.from} {' <'} {msg.fromEmail} {' >'}</p>
            <p className="text-ios-muted">받는사람: {msg.to}</p>
            <p className="text-ios-muted">{new Date(msg.date).toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onReply} className="p-2 rounded-xl text-ios-muted" aria-label="답장" disabled>
              <Reply className="size-4" />
            </button>
            <button onClick={onForward} className="p-2 rounded-xl text-ios-muted" aria-label="전달" disabled>
              <Forward className="size-4" />
            </button>
            <button onClick={() => { /* Star */ }} className="p-2 rounded-xl text-ios-muted" aria-label={msg.starred ? '별표 제거' : '별표 추가'} aria-pressed={msg.starred}>
              <StarIcon className={cn('size-4', msg.starred ? 'fill-current text-ios-yellow' : '')} />
            </button>
          </div>
        </div>

        {msg.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.labels.map(label => (
              <Pill key={label} tone="accent">
                {label}
              </Pill>
            ))}
          </div>
        )}
      </div>

      {/* Message body */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto prose prose-ios dark:prose-invert">
          <pre className="whitespace-pre-wrap text-[14px] leading-relaxed">{msg.body}</pre>
        </div>
      </div>
    </motion.div>
  );
}