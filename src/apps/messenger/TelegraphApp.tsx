import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Search, Pin, BellOff, MoreVertical, Lock, Clock,
  Check, CheckCheck, Eye, EyeOff, Trash2, Edit, Send, Mic,
  Paperclip, Smile, Settings, Shield, AlertTriangle
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { TELEGRAPH_CONTACTS, TELEGRAPH_CONVERSATIONS, type Conversation, type MessengerMessage, type MessengerContact } from './MessengerTypes';
import { AppShell } from '../AppShell';
import { SPRING_SNAPPY, SPRING_SOFT, SPRING_BOUNCY, prefersReducedMotion } from '@/utils/motion';
import { cn } from '@/utils/cn';

export function TelegraphApp() {
  const [conversations] = useState<Conversation[]>(TELEGRAPH_CONVERSATIONS.map(c => ({ ...c, messages: [...c.messages] })));
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [typingContact, setTypingContact] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const gameDateTime = useGameStore(s => s.gameDateTime);

  // Simulate "typing..." indicator
  useEffect(() => {
    if (!selectedConversation) return;
    const otherContact = selectedConversation.participants[0];
    if (otherContact.status === 'typing') {
      const timer = setTimeout(() => setTypingContact(otherContact.id), 1000);
      return () => clearTimeout(timer);
    }
    setTypingContact(null);
  }, [selectedConversation]);

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
        // Pinned first, then by last activity
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
      id: `tm-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: 'me',
      senderName: 'NightOwl',
      content: newMessage.trim(),
      timestamp: gameDateTime,
      status: 'sending',
      type: 'text',
    };
    selectedConversation.messages.push(msg);
    setNewMessage('');

    // Simulate sending animation
    setTimeout(() => {
      msg.status = 'sent';
      setTimeout(() => {
        msg.status = 'delivered';
        setTimeout(() => {
          msg.status = 'read';
          // Simulate reply
          if (Math.random() > 0.5) {
            simulateReply(selectedConversation);
          }
        }, 1000 + Math.random() * 2000);
      }, 500);
    }, 100);
  };

  const simulateReply = (conv: Conversation) => {
    const contact = conv.participants[0];
    const replies = [
      '확인했습니다.',
      '알겠습니다.',
      '준비해두겠습니다.',
      '거래 시간 맞춰서 연락드릴게요.',
      '에스크로 생성 완료했습니다.',
    ];
    setTypingContact(contact.id);
    setTimeout(() => {
      setTypingContact(null);
      const replyMsg: MessengerMessage = {
        id: `tm-${Date.now()}`,
        conversationId: conv.id,
        senderId: contact.id,
        senderName: contact.name,
        content: replies[Math.floor(Math.random() * replies.length)],
        timestamp: gameDateTime,
        status: 'read',
        type: 'text',
      };
      conv.messages.push(replyMsg);
      conv.lastActivity = gameDateTime;
      conv.unreadCount = 0;
    }, 1500 + Math.random() * 2000);
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

  const deleteConversation = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 대화를 삭제하시겠습니까? 복구할 수 없습니다.')) {
      const idx = conversations.indexOf(conv);
      if (idx >= 0) conversations.splice(idx, 1);
      if (selectedConversation === conv) setSelectedConversation(null);
    }
  };

  const reduced = prefersReducedMotion();

  return (
    <AppShell
      title="Telegraph"
      largeTitle={false}
      className="flex flex-col h-full"
      trailing={
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-xl text-ios-muted" aria-label="설정">
            <Settings className="size-5" />
          </button>
          <button className="p-2 rounded-xl text-ios-muted" aria-label="새 대화" disabled>
            <Edit className="size-5" />
          </button>
        </div>
      }
    >
      <div className="flex h-full min-h-0">
        {/* Conversation List: full screen until a chat is opened */}
        <aside className={cn('min-h-0 w-full flex-col bg-ios-bg', selectedConversation ? 'hidden' : 'flex')}>
          {/* Search */}
          <div className="p-3 border-b border-ios-separator/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ios-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="대화 검색"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-ios-surface text-[14px] text-ios-text placeholder:text-ios-muted focus:outline-none focus:ring-2 focus:ring-ios-accent/20"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex h-full items-center justify-center text-ios-muted p-4">
                <div className="text-center">
                  <Lock className="size-12 mx-auto mb-3 text-ios-muted/30" />
                  <p className="text-[14px]">비밀 대화가 없습니다</p>
                  <p className="text-[12px] text-ios-muted mt-1">새 대화를 시작하려면 연락처를 추가하세요</p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredConversations.map(conv => (
                  <TelegraphConversationRow
                    key={conv.id}
                    conv={conv}
                    selected={selectedConversation?.id === conv.id}
                    onClick={() => handleConversationClick(conv)}
                    onPin={e => togglePin(conv, e)}
                    onMute={e => toggleMute(conv, e)}
                    onDelete={e => deleteConversation(conv, e)}
                    formatTime={formatTime}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Security badge */}
          <div className="p-3 border-t border-ios-separator/20">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ios-green/10">
              <Shield className="size-4 text-ios-green" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-ios-green">종단간 암호화 활성화</p>
                <p className="text-[11px] text-ios-muted">메시지는 서버에 저장되지 않음</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Chat View */}
        <main className={cn('relative min-w-0 flex-1 flex-col', selectedConversation ? 'flex' : 'hidden')}>
          {selectedConversation ? (
            <TelegraphChatView
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSend={sendMessage}
              typingContact={typingContact}
              messagesEndRef={messagesEndRef}
              gameDateTime={gameDateTime}
            />
          ) : (
            <TelegraphWelcomeScreen />
          )}
        </main>
      </div>
    </AppShell>
  );
}

function TelegraphConversationRow({
  conv,
  selected,
  onClick,
  onPin,
  onMute,
  onDelete,
  formatTime,
}: {
  conv: Conversation;
  selected: boolean;
  onClick: () => void;
  onPin: (e: React.MouseEvent) => void;
  onMute: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
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
      <div className="relative size-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-purple to-ios-blue flex items-center justify-center text-[18px]">
        {contact.avatar}
        {contact.status === 'online' && (
          <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-ios-green ring-2 ring-ios-bg" />
        )}
        {contact.status === 'typing' && (
          <span className="absolute bottom-0 right-0 size-3.5 rounded-full bg-ios-yellow ring-2 ring-ios-bg animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={cn('font-medium truncate', selected ? 'text-ios-accent' : 'text-ios-text')}>
              {contact.name}
            </span>
            {contact.verified && (
              <Lock className="size-3.5 text-ios-green shrink-0" aria-label="검증된 연락처" />
            )}
            {conv.pinned && (
              <Pin className="size-3.5 text-ios-accent shrink-0" aria-label="고정된 대화" />
            )}
            {conv.muted && (
              <BellOff className="size-3.5 text-ios-muted shrink-0" aria-label="알림 끔" />
            )}
          </div>
          <span className={cn('shrink-0 text-[12px] tabular-nums', conv.unreadCount > 0 ? 'text-ios-accent font-semibold' : 'text-ios-muted')}>
            {formatTime(conv.lastActivity)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={cn('truncate text-[13px] flex-1', lastMsg?.status === 'read' ? 'text-ios-muted' : 'text-ios-text font-medium')}>
            {lastMsg?.senderName === 'NightOwl' ? '나: ' : ''}{lastMsg?.content ?? '메시지 없음'}
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
          {conv.autoDeleteTimer && conv.autoDeleteTimer > 0 && (
            <div className="shrink-0 flex items-center gap-1 text-[11px] text-ios-muted">
              <Clock className="size-3" />
              <span>{formatTimer(conv.autoDeleteTimer)} 후 자동 삭제</span>
            </div>
          )}
        </div>
      </div>

      {/* Context menu on long press / right click */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity">
        <div className="flex items-center gap-1 rounded-lg bg-ios-surface ring-1 ring-black/5 dark:ring-white/5 p-1">
          <button onClick={onPin} className="p-2 rounded text-ios-muted" aria-label={conv.pinned ? '고정 해제' : '고정'}>
            <Pin className={cn('size-4', conv.pinned ? 'fill-current text-ios-accent' : '')} />
          </button>
          <button onClick={onMute} className="p-2 rounded text-ios-muted" aria-label={conv.muted ? '알림 켜기' : '알림 끄기'}>
            <BellOff className={cn('size-4', conv.muted ? 'fill-current text-ios-orange' : '')} />
          </button>
          <button onClick={onDelete} className="p-2 rounded text-ios-muted" aria-label="삭제">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function formatTimer(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간`;
  return `${Math.floor(seconds / 86400)}일`;
}

function TelegraphWelcomeScreen() {
  const reduced = prefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="flex h-full items-center justify-center p-6"
    >
      <div className="text-center max-w-xs">
        <div className="mx-auto mb-6 size-24 rounded-3xl bg-gradient-to-br from-ios-purple to-ios-blue flex items-center justify-center">
          <Lock className="size-12 text-white" />
        </div>
        <h2 className="text-[22px] font-bold mb-2">비밀 대화</h2>
        <p className="text-ios-muted mb-6 leading-relaxed">
          Telegraph는 종단간 암호화된 비밀 메신저입니다.
          메시지는 자동 삭제 타이머로 관리되며 서버에 남지 않습니다.
        </p>
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
            <Lock className="size-5 text-ios-green shrink-0" />
            <div>
              <p className="font-medium text-[13px]">종단간 암호화</p>
              <p className="text-[12px] text-ios-muted">나와 상대만 읽을 수 있음</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
            <Clock className="size-5 text-ios-orange shrink-0" />
            <div>
              <p className="font-medium text-[13px]">자동 삭제 타이머</p>
              <p className="text-[12px] text-ios-muted">설정 시간 후 메시지 소멸</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
            <Shield className="size-5 text-ios-blue shrink-0" />
            <div>
              <p className="font-medium text-[13px]">스크린샷 방지</p>
              <p className="text-[12px] text-ios-muted">화면 캡처 시 알림 전송</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TelegraphChatView({
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
        <div className="relative size-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-purple to-ios-blue flex items-center justify-center text-[16px]">
          {contact.avatar}
          {contact.status === 'online' && (
            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-ios-green ring-2 ring-ios-bg" />
          )}
          {contact.status === 'typing' && (
            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-ios-yellow ring-2 ring-ios-bg animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold truncate">{contact.name}</h1>
            {contact.verified && <Lock className="size-3.5 text-ios-green" aria-label="검증됨" />}
          </div>
          <p className="text-[12px] text-ios-muted truncate">
            {contact.status === 'typing' ? '입력 중...' :
             contact.status === 'online' ? '온라인' :
             contact.lastSeen ? `마지막 접속 ${formatRelativeTime(contact.lastSeen, gameDateTime)}` : '오프라인'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl text-ios-muted" aria-label="음성 통화" disabled>
            <Mic className="size-5" />
          </button>
          <button className="p-2 rounded-xl text-ios-muted" aria-label="영상 통화" disabled>
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2z" />
              <rect x="9" y="13" width="6" height="6" rx="1" />
              <circle cx="9" cy="9" r="1" />
            </svg>
          </button>
          <button className="p-2 rounded-xl text-ios-muted" aria-label="더보기">
            <MoreVertical className="size-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 50%, transparent 50%)' }}>
        {conversation.autoDeleteTimer && conversation.autoDeleteTimer > 0 && (
          <div className="flex justify-center mb-4">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_SNAPPY}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-full bg-ios-orange/20 text-ios-orange"
            >
              <Clock className="size-3" />
              이 대화는 {formatTimer(conversation.autoDeleteTimer)} 후 자동 삭제됩니다
            </motion.span>
          </div>
        )}

        <AnimatePresence>
          {conversation.messages.map((msg, index) => (
            <TelegraphMessageBubble
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
            <div className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
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
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
              placeholder="메시지 입력 (자동 삭제: 1시간)"
              rows={1}
              className="w-full px-4 py-2.5 pr-12 rounded-2xl bg-ios-surface text-[15px] text-ios-text placeholder:text-ios-muted focus:outline-none focus:ring-2 focus:ring-ios-accent/20 resize-none min-h-[44px] max-h-32"
              style={{ height: '44px' }}
            />
          </div>
          <button
            onClick={onSend}
            disabled={!newMessage.trim()}
            className="p-2.5 rounded-xl bg-ios-accent text-white shrink-0 disabled:opacity-40 transition-colors"
            aria-label="전송"
          >
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TelegraphMessageBubble({
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
    read: <CheckCheck className="size-3.5 text-ios-blue" />,
  };

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={SPRING_BOUNCY}
      className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}
    >
      {!isOwn && (
        <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-ios-purple to-ios-blue flex items-center justify-center text-[14px] self-end">
          {msg.type === 'timer' ? '⏱️' : '🕶️'}
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
              ? 'bg-ios-accent text-white rounded-tr-md'
              : 'bg-ios-surface text-ios-text rounded-tl-md ring-1 ring-black/5 dark:ring-white/5'
          )}
        >
          {msg.type === 'timer' ? (
            <div className="flex items-center gap-2 text-[13px] opacity-80">
              <Clock className="size-4" />
              <span>{msg.content}</span>
            </div>
          ) : msg.type === 'system' ? (
            <p className="text-[12px] text-center opacity-70">{msg.content}</p>
          ) : (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[11px] text-ios-muted">
            {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && statusIcons[msg.status]}
          {msg.expiryTimer && msg.expiryTimer > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-ios-orange">
              <Clock className="size-3" />
              {formatTimer(msg.expiryTimer)} 후 삭제
            </span>
          )}
        </div>
      </div>

      {isOwn && (
        <div className="size-8 shrink-0" />
      )}
    </motion.div>
  );
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