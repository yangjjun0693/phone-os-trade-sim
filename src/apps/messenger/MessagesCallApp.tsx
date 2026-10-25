import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Search, Pin, BellOff, MoreVertical, Phone, Video,
  Check, CheckCheck, Mic, Paperclip, Smile, Settings, Shield,
  Contact, Voicemail, Hash, UserPlus, MessageCircle, Clock
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { MessengerChat } from './MessengerChat';
import { MessengerInbox } from './MessengerInbox';
import { MESSAGES_CALL_CONTACTS, MESSAGES_CALL_CONVERSATIONS, type Conversation, type MessengerMessage, type MessengerContact } from './MessengerTypes';
import { AppShell } from '../AppShell';
import { SPRING_SNAPPY, SPRING_SOFT, SPRING_BOUNCY, prefersReducedMotion } from '@/utils/motion';
import { cn } from '@/utils/cn';

export function MessagesCallApp() {
  const [conversations] = useState<Conversation[]>(MESSAGES_CALL_CONVERSATIONS.map(c => ({ ...c, messages: [...c.messages] })));
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'chats' | 'calls' | 'contacts'>('chats');
  const [newMessage, setNewMessage] = useState('');
  const [typingContact, setTypingContact] = useState<string | null>(null);
  /** Game thread opened from the inbox (null = no thread open). */
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const gameDateTime = useGameStore(s => s.gameDateTime);

  // Simulate "typing..." indicator
  useEffect(() => {
    if (!selectedConversation) return;
    const otherContact = selectedConversation.participants[0];
    // Randomly simulate typing
    if (Math.random() < 0.001) {
      setTypingContact(otherContact.id);
      setTimeout(() => setTypingContact(null), 2000 + Math.random() * 3000);
    }
  }, [selectedConversation, gameDateTime]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const filteredConversations = useMemo(() => {
    return conversations
      .filter(c => {
        const contact = c.participants[0];
        const q = searchQuery.toLowerCase();
        return contact.name.toLowerCase().includes(q) || contact.handle.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      });
  }, [conversations, searchQuery]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date(gameDateTime);
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    const msg: MessengerMessage = {
      id: `mcm-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: 'me',
      senderName: '김철수',
      content: newMessage.trim(),
      timestamp: gameDateTime,
      status: 'sending',
      type: 'text',
    };
    selectedConversation.messages.push(msg);
    setNewMessage('');

    setTimeout(() => {
      msg.status = 'sent';
      setTimeout(() => {
        msg.status = 'delivered';
        setTimeout(() => {
          msg.status = 'read';
        }, 1000 + Math.random() * 2000);
      }, 500);
    }, 100);
  };

  const handleConversationClick = (conv: Conversation) => {
    setSelectedConversation(conv);
    conv.unreadCount = 0;
  };

  const togglePin = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    conv.pinned = !conv.pinned;
  };

  const toggleMute = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    conv.muted = !conv.muted;
  };

  const reduced = prefersReducedMotion();

  // Tabs
  const tabs = [
    { id: 'chats', label: '대화', icon: MessageCircle, count: conversations.reduce((sum, c) => sum + c.unreadCount, 0) },
    { id: 'calls', label: '통화', icon: Phone, count: 0 },
    { id: 'contacts', label: '연락처', icon: Contact, count: 0 },
  ];

  return (
    <div className="relative h-full overflow-hidden">
    <AppShell
      title="메시지/통화"
      largeTitle={false}
      className="flex flex-col h-full"
      trailing={
        <div className="flex items-center gap-1">
          <button onClick={() => setViewMode('contacts')} className="p-2 rounded-xl text-ios-muted" aria-label="새 메시지">
            <UserPlus className="size-5" />
          </button>
          <button className="p-2 rounded-xl text-ios-muted" aria-label="설정">
            <Settings className="size-5" />
          </button>
        </div>
      }
    >
      <div className="flex h-full min-h-0">
        {/* List: full screen until a chat is opened */}
        <aside className={cn('min-h-0 w-full flex-col bg-ios-bg', selectedConversation && viewMode === 'chats' ? 'hidden' : 'flex')}>
          {/* Tab Bar */}
          <div className="flex border-b border-ios-separator/20">
            {tabs.map(tab => {
              const active = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setViewMode(tab.id as any); setSelectedConversation(null); }}
                  className={cn(
                    'relative flex-1 flex items-center justify-center gap-1.5 py-3 text-[14px] font-medium transition-colors',
                    active ? 'text-ios-accent' : 'text-ios-muted'
                  )}
                >
                  <tab.icon className="size-5" aria-hidden />
                  {tab.label}
                  {tab.count > 0 && (
                    <motion.span
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={SPRING_BOUNCY}
                      className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-ios-red text-white"
                    >
                      {tab.count > 9 ? '9+' : tab.count}
                    </motion.span>
                  )}
                  {active ? (
                    <motion.span
                      layoutId="messages-tab-underline"
                      transition={SPRING_SNAPPY}
                      className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-ios-accent"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-ios-separator/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ios-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={viewMode === 'chats' ? '대화 검색' : viewMode === 'calls' ? '통화 기록 검색' : '연락처 검색'}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-ios-surface text-[14px] text-ios-text placeholder:text-ios-muted focus:outline-none focus:ring-2 focus:ring-ios-accent/20"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'chats' && (
              <div className="border-b border-ios-separator/20">
                <MessengerInbox channel="phone" onOpenThread={setOpenThreadId} />
              </div>
            )}

            {viewMode === 'chats' && (
              <div className="p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-ios-muted p-4">
                    <div className="text-center">
                      <MessageCircle className="size-12 mx-auto mb-3 text-ios-muted/30" />
                      <p className="text-[14px]">대화가 없습니다</p>
                      <p className="text-[12px] text-ios-muted mt-1">새 대화를 시작해보세요</p>
                    </div>
                  </div>
                ) : (
                  filteredConversations.map(conv => (
                    <MessagesCallConversationRow
                      key={conv.id}
                      conv={conv}
                      selected={selectedConversation?.id === conv.id}
                      onClick={() => handleConversationClick(conv)}
                      onPin={e => togglePin(conv, e)}
                      onMute={e => toggleMute(conv, e)}
                      formatTime={formatTime}
                    />
                  ))
                )}
              </div>
            )}

            {viewMode === 'calls' && (
              <CallHistoryView contacts={MESSAGES_CALL_CONTACTS} searchQuery={searchQuery} formatTime={formatTime} />
            )}

            {viewMode === 'contacts' && (
              <ContactsView contacts={MESSAGES_CALL_CONTACTS} searchQuery={searchQuery} formatTime={formatTime} />
            )}
          </div>

          {/* Identity badge */}
          <div className="p-3 border-t border-ios-separator/20">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ios-green/10">
              <Contact className="size-4 text-ios-green" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-ios-green">실명 신원</p>
                <p className="text-[11px] text-ios-muted">가족, 지인, 직장 연락처</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className={cn('relative min-w-0 flex-1 flex-col', selectedConversation && viewMode === 'chats' ? 'flex' : 'hidden')}>
          {selectedConversation && viewMode === 'chats' ? (
            <MessagesCallChatView
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSend={sendMessage}
              typingContact={typingContact}
              messagesEndRef={messagesEndRef}
              gameDateTime={gameDateTime}
            />
          ) : viewMode === 'calls' ? (
            <CallKeypadView onCall={handleCall} />
          ) : (
            <ContactsMainView contacts={MESSAGES_CALL_CONTACTS} onSelect={contact => { /* Open chat */ }} />
          )}
        </main>
      </div>
    </AppShell>

      {openThreadId ? (
        <MessengerChat
          channel="phone"
          messageId={openThreadId}
          onClose={() => setOpenThreadId(null)}
        />
      ) : null}
    </div>
  );
}

function MessagesCallConversationRow({
  conv,
  selected,
  onClick,
  onPin,
  onMute,
  formatTime,
}: {
  conv: Conversation;
  selected: boolean;
  onClick: () => void;
  onPin: (e: React.MouseEvent) => void;
  onMute: (e: React.MouseEvent) => void;
  formatTime: (date: string) => string;
}) {
  const contact = conv.participants[0];
  const lastMsg = conv.messages[conv.messages.length - 1];
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      layout
      initial={reduced ? undefined : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: 20 }}
      transition={SPRING_SNAPPY}
      onClick={onClick}
      className={cn(
        'relative flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors group',
        selected ? 'bg-ios-accent/15 ring-1 ring-ios-accent/30' : ''
      )}
    >
      <div className="relative size-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-green to-ios-blue flex items-center justify-center text-[18px]">
        {contact.avatar}
        {contact.status === 'online' && (
          <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-ios-green ring-2 ring-ios-bg" />
        )}
        {contact.status === 'away' && (
          <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-ios-orange ring-2 ring-ios-bg" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={cn('font-medium truncate', selected ? 'text-ios-accent' : 'text-ios-text')}>
              {contact.name}
            </span>
            {conv.pinned && <Pin className="size-3.5 text-ios-accent shrink-0" />}
            {conv.muted && <BellOff className="size-3.5 text-ios-muted shrink-0" />}
          </div>
          <span className={cn('shrink-0 text-[12px] tabular-nums', conv.unreadCount > 0 ? 'text-ios-accent font-semibold' : 'text-ios-muted')}>
            {formatTime(conv.lastActivity)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={cn('truncate text-[13px] flex-1', lastMsg?.status === 'read' ? 'text-ios-muted' : 'text-ios-text font-medium')}>
            {lastMsg?.senderName === '김철수' ? '나: ' : ''}{lastMsg?.content ?? '메시지 없음'}
          </p>
          {conv.unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING_BOUNCY}
              className="shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-ios-accent text-white"
            >
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </motion.span>
          )}
        </div>
      </div>

      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity">
        <div className="flex items-center gap-1 rounded-lg bg-ios-surface ring-1 ring-black/5 dark:ring-white/5 p-1">
          <button onClick={onPin} className="p-2 rounded text-ios-muted" aria-label={conv.pinned ? '고정 해제' : '고정'}>
            <Pin className={cn('size-4', conv.pinned ? 'fill-current text-ios-accent' : '')} />
          </button>
          <button onClick={onMute} className="p-2 rounded text-ios-muted" aria-label={conv.muted ? '알림 켜기' : '알림 끄기'}>
            <BellOff className={cn('size-4', conv.muted ? 'fill-current text-ios-orange' : '')} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CallHistoryView({ contacts, searchQuery, formatTime }: { contacts: MessengerContact[]; searchQuery: string; formatTime: (date: string) => string }) {
  // Mock call history
  const callHistory = [
    { contact: contacts[0], type: 'incoming' as const, time: '2026-03-14T20:30:00.000Z', duration: '3분 22초', missed: false },
    { contact: contacts[3], type: 'outgoing' as const, time: '2026-03-14T18:15:00.000Z', duration: '1분 45초', missed: false },
    { contact: contacts[1], type: 'missed' as const, time: '2026-03-13T19:00:00.000Z', duration: '', missed: true },
    { contact: contacts[4], type: 'incoming' as const, time: '2026-03-13T14:20:00.000Z', duration: '5분 10초', missed: false },
    { contact: contacts[2], type: 'outgoing' as const, time: '2026-03-12T16:00:00.000Z', duration: '0분 30초', missed: false },
  ];

  const filtered = callHistory.filter(h =>
    h.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.contact.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-ios-muted p-4">
        <div className="text-center">
          <Phone className="size-12 mx-auto mb-3 text-ios-muted/30" />
          <p className="text-[14px]">통화 기록이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {filtered.map((call, index) => (
        <motion.div
          key={index}
          layout
          className="flex items-center gap-3 px-3 py-3 rounded-xl"
        >
          <div className="size-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-green to-ios-blue flex items-center justify-center text-[20px]">
            {call.contact.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{call.contact.name}</span>
              {call.type === 'incoming' && <span className="text-[11px] text-ios-green flex items-center gap-1"><svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 5v14H5V5h14m0-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/><path d="M15 3v4"/><path d="M15 17v4"/><path d="M3 9h4"/><path d="M17 9h4"/></svg> 수신</span>}
              {call.type === 'outgoing' && <span className="text-[11px] text-ios-blue flex items-center gap-1"><svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19V5a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"/><path d="M15 3v4"/><path d="M15 17v4"/><path d="M3 9h4"/><path d="M17 9h4"/></svg> 발신</span>}
              {call.type === 'missed' && <span className="text-[11px] text-ios-red flex items-center gap-1"><svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> 부재중</span>}
            </div>
            <p className="text-[12px] text-ios-muted">{formatTime(call.time)} · {call.duration}</p>
          </div>
          <button className="p-2 rounded-xl text-ios-muted" aria-label="전화 걸기">
            <Phone className="size-5" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}

function ContactsView({ contacts, searchQuery, formatTime }: { contacts: MessengerContact[]; searchQuery: string; formatTime: (date: string) => string }) {
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-2 space-y-1">
      {filtered.map(contact => (
        <motion.div
          key={contact.id}
          layout
          className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer"
        >
          <div className="size-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-green to-ios-blue flex items-center justify-center text-[20px]">
            {contact.avatar}
            {contact.status === 'online' && (
              <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-ios-green ring-2 ring-ios-bg" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{contact.name}</span>
              <span className="text-ios-muted text-[13px]">@{contact.handle}</span>
            </div>
            <p className="text-[12px] text-ios-muted">{contact.bio}</p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-xl text-ios-muted" aria-label="메시지">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button className="p-2 rounded-xl text-ios-muted" aria-label="전화">
              <Phone className="size-5" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MessagesCallChatView({
  conversation,
  onBack,
  newMessage,
  setNewMessage,
  onSend,
  typingContact,
  messagesEndRef,
  gameDateTime,
}: {
  conversation: Conversation;
  onBack: () => void;
  newMessage: string;
  setNewMessage: (v: string) => void;
  onSend: () => void;
  typingContact: string | null;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  gameDateTime: string;
}) {
  const contact = conversation.participants[0];
  const reduced = prefersReducedMotion();

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-ios-separator/20 px-4 py-3">
        <button onClick={onBack} className="p-2 rounded-xl text-ios-muted" aria-label="뒤로">
          <ChevronLeft className="size-5" />
        </button>
        <div className="relative size-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-green to-ios-blue flex items-center justify-center text-[16px]">
          {contact.avatar}
          {contact.status === 'online' && (
            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-ios-green ring-2 ring-ios-bg" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">{contact.name}</h1>
          <p className="text-[12px] text-ios-muted truncate">
            {typingContact === contact.id ? '입력 중...' :
             contact.status === 'online' ? '온라인' :
             contact.lastSeen ? `마지막 접속 ${formatRelativeTime(contact.lastSeen, gameDateTime)}` : '오프라인'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl text-ios-muted" aria-label="음성 통화" disabled>
            <Phone className="size-5" />
          </button>
          <button className="p-2 rounded-xl text-ios-muted" aria-label="영상 통화" disabled>
            <Video className="size-5" />
          </button>
          <button className="p-2 rounded-xl text-ios-muted" aria-label="더보기">
            <MoreVertical className="size-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {conversation.messages.map((msg, index) => (
            <MessagesCallMessageBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.senderId === 'me'}
              index={index}
              showTime={index === 0 || isNewDay(msg.timestamp, conversation.messages[index - 1]?.timestamp)}
              reduced={reduced}
            />
          ))}
        </AnimatePresence>

        {typingContact === contact.id && (
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2 text-ios-muted"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
              <TypingIndicator />
              <span className="text-[13px]">{contact.name}님이 입력 중...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-strong sticky bottom-0 z-10 border-t border-ios-separator/20 px-3 py-3">
        <div className="flex items-end gap-2">
          <button className="p-2.5 rounded-xl text-ios-muted shrink-0" aria-label="첨부" disabled>
            <Paperclip className="size-5" />
          </button>
          <button className="p-2.5 rounded-xl text-ios-muted shrink-0" aria-label="이모티콘" disabled>
            <Smile className="size-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              placeholder="메시지 입력"
              rows={1}
              className="w-full px-4 py-2.5 pr-12 rounded-2xl bg-ios-surface text-[15px] text-ios-text placeholder:text-ios-muted focus:outline-none focus:ring-2 focus:ring-ios-accent/20 resize-none min-h-[44px] max-h-32"
              style={{ height: '44px' }}
            />
          </div>
          <button
            onClick={onSend}
            disabled={!newMessage.trim()}
            className="p-2.5 rounded-xl bg-ios-green text-white shrink-0 disabled:opacity-40 transition-colors"
            aria-label="전송"
          >
            <Check className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessagesCallMessageBubble({
  msg,
  isOwn,
  index,
  showTime,
  reduced,
}: {
  msg: MessengerMessage;
  isOwn: boolean;
  index: number;
  showTime: boolean;
  reduced: boolean;
}) {
  const statusIcons = {
    sending: <Clock className="size-3.5 text-ios-muted" />,
    sent: <Check className="size-3.5 text-ios-muted" />,
    delivered: <CheckCheck className="size-3.5 text-ios-muted" />,
    read: <CheckCheck className="size-3.5 text-ios-green" />,
  };

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING_BOUNCY}
      className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}
    >
      {!isOwn && (
        <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-ios-green to-ios-blue flex items-center justify-center text-[14px] self-end">
          {msg.type === 'system' ? 'ℹ️' : '👤'}
        </div>
      )}

      <div className={cn('max-w-[70%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && (
          <p className="text-[11px] text-ios-muted mb-0.5 px-1">{msg.senderName}</p>
        )}

        <div
          className={cn(
            'relative px-4 py-2 rounded-2xl',
            isOwn
              ? 'bg-ios-green text-white rounded-tr-md'
              : 'bg-ios-surface text-ios-text rounded-tl-md ring-1 ring-black/5 dark:ring-white/5'
          )}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>

        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[11px] text-ios-muted">
            {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && statusIcons[msg.status]}
        </div>
      </div>

      {isOwn && (
        <div className="size-8 shrink-0" />
      )}
    </motion.div>
  );
}

function CallKeypadView({ onCall }: { onCall: (number: string) => void }) {
  const [number, setNumber] = useState('');

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <p className="text-[32px] font-bold tabular-nums tracking-widest">{number || '번호 입력'}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-xs w-full">
        {keys.flatMap((row, rowIndex) =>
          row.map((key, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => setNumber(n => n + key)}
              className="aspect-square rounded-full bg-ios-surface ring-1 ring-black/5 dark:ring-white/5 text-[24px] font-medium text-ios-text active:bg-ios-separator/20 active:scale-95 transition-transform"
            >
              {key}
            </button>
          ))
        )}
      </div>
      <div className="mt-8 flex items-center justify-center gap-8">
        <button className="size-16 rounded-full bg-ios-red flex items-center justify-center active:scale-95 transition-transform" aria-label="통화 종료">
          <Phone className="size-7 text-white" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <button
          onClick={() => { if (number) onCall(number); }}
          disabled={!number}
          className="size-16 rounded-full bg-ios-green flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          aria-label="전화 걸기"
        >
          <Phone className="size-7 text-white" />
        </button>
      </div>
      {number && (
        <button
          onClick={() => setNumber(n => n.slice(0, -1))}
          className="mt-4 p-2 rounded-xl text-ios-muted"
          aria-label="지우기"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 3v4" />
            <path d="M5 21h14" />
            <path d="M9 7H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          </svg>
        </button>
      )}
    </div>
  );
}

function ContactsMainView({ contacts, onSelect }: { contacts: MessengerContact[]; onSelect: (contact: MessengerContact) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-ios-separator/20">
        <h2 className="text-[17px] font-semibold">연락처</h2>
        <p className="text-[13px] text-ios-muted mt-1">총 {contacts.length}명</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {contacts.map(contact => (
            <motion.div
              key={contact.id}
              layout
              onClick={() => onSelect(contact)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer"
            >
              <div className="relative size-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-green to-ios-blue flex items-center justify-center text-[20px]">
                {contact.avatar}
                {contact.status === 'online' && (
                  <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-ios-green ring-2 ring-ios-bg" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{contact.name}</span>
                </div>
                <p className="text-[12px] text-ios-muted">@{contact.handle} · {contact.bio}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-xl text-ios-muted" aria-label="메시지">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
                <button className="p-2 rounded-xl text-ios-muted" aria-label="전화">
                  <Phone className="size-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function handleCall(number: string) {
  // Would initiate call
  console.log('Calling:', number);
}

function isNewDay(current: string, previous?: string): boolean {
  if (!previous) return true;
  const curr = new Date(current);
  const prev = new Date(previous);
  return curr.getDate() !== prev.getDate() || curr.getMonth() !== prev.getMonth();
}

function formatRelativeTime(dateStr: string, gameDateTime: string): string {
  const date = new Date(dateStr);
  const now = new Date(gameDateTime);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function TypingIndicator() {
  const reduced = prefersReducedMotion();
  if (reduced) return <span>...</span>;

  return (
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="size-1.5 rounded-full bg-ios-muted"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}