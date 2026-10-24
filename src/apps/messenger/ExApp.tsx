import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Repeat, Share2, Bookmark, MoreHorizontal,
  ChevronLeft, Search, Bell, Settings, Plus, Flag, Eye, EyeOff,
  Link2, Copy, Download, AlertTriangle, Shield, Zap
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { EX_POSTS, type ExPost } from './MessengerTypes';
import { AppShell } from '../AppShell';
import { SPRING_SNAPPY, SPRING_SOFT, SPRING_BOUNCY, prefersReducedMotion } from '@/utils/motion';
import { cn } from '@/utils/cn';
import { useExAppHandlers } from './useExAppHandlers';

export function ExApp() {
  const [posts, setPosts] = useState<ExPost[]>(EX_POSTS.map(p => ({ ...p })));
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ExPost | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gameDateTime = useGameStore(s => s.gameDateTime);

  const handlers = useExAppHandlers(setPosts);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate pull to refresh
    await new Promise(r => setTimeout(r, 1000));
    // Add a new mock post at top
    const newPost: ExPost = {
      id: `ex-${Date.now()}`,
      author: {
        id: 'ex-new',
        name: 'SystemBot',
        handle: '@system',
        avatar: '🤖',
        status: 'online',
        identity: 'alias',
        verified: true,
        bio: '자동 알림 시스템',
      },
      content: '새로운 시장 데이터가 업데이트되었습니다. 피드를 새로고침하세요.',
      timestamp: gameDateTime,
      likes: 0,
      liked: false,
      replies: 0,
      reposts: 0,
    };
    setPosts(prev => [newPost, ...prev]);
    setRefreshing(false);
  }, [gameDateTime]);

  const formatTime = (dateStr: string) => {
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
  };

  const reduced = prefersReducedMotion();

  return (
    <AppShell
      title="Ex"
      largeTitle={!selectedPost}
      className="flex flex-col h-full"
      trailing={
        <div className="flex items-center gap-1">
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/15" aria-label="알림">
            <Bell className="size-5" />
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/15" aria-label="새로고침">
            {refreshing ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </motion.div>
            ) : (
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            )}
          </button>
          <button className="p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/15" aria-label="게시글 작성" disabled>
            <Plus className="size-5" />
          </button>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {selectedPost ? (
          <ExPostDetail
            key={selectedPost.id}
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onLike={handlers.toggleLike}
            onRepost={handlers.handleRepost}
            onShare={handlers.handleShare}
            onBookmark={handlers.toggleBookmark}
            onFlag={handlers.handleFlag}
            formatTime={formatTime}
            gameDateTime={gameDateTime}
          />
        ) : (
          <ExFeed
            key="feed"
            posts={posts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onPostClick={setSelectedPost}
            formatTime={formatTime}
            scrollRef={scrollRef}
            reduced={reduced}
            handlers={handlers}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

interface ExFeedProps {
  posts: ExPost[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onPostClick: (post: ExPost) => void;
  formatTime: (date: string) => string;
  scrollRef: React.RefObject<HTMLDivElement>;
  reduced: boolean;
  handlers: ReturnType<typeof useExAppHandlers>;
}

function ExFeed({
  posts,
  searchQuery,
  setSearchQuery,
  onRefresh,
  refreshing,
  onPostClick,
  formatTime,
  scrollRef,
  reduced,
  handlers,
}: ExFeedProps) {
  const filteredPosts = posts.filter(p =>
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="p-3 border-b border-ios-separator/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ios-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="게시글 검색"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-ios-surface text-[14px] text-ios-text placeholder:text-ios-muted focus:outline-none focus:ring-2 focus:ring-ios-accent/20"
          />
        </div>
      </div>

      {/* Feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={() => {}}
      >
        {refreshing && (
          <motion.div
            initial={false}
            animate={{ height: 40 }}
            className="fixed top-0 left-0 right-0 z-20 flex items-center justify-center h-10 bg-ios-bg border-b border-ios-separator/20"
            style={{ transform: 'translateY(-100%)' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <svg className="size-5 text-ios-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
          {filteredPosts.map((post, index) => (
            <ExPostCard
              key={post.id}
              post={post}
              index={index}
              onClick={() => onPostClick(post)}
              onLike={handlers.toggleLike}
              onRepost={handlers.handleRepost}
              onShare={handlers.handleShare}
              onBookmark={handlers.toggleBookmark}
              onFlag={handlers.handleFlag}
              formatTime={formatTime}
              reduced={reduced}
            />
          ))}
        </AnimatePresence>

        {filteredPosts.length === 0 && (
          <div className="flex h-64 items-center justify-center text-ios-muted">
            <p className="text-[14px]">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExPostCard({
  post,
  index,
  onClick,
  onLike,
  onRepost,
  onShare,
  onBookmark,
  onFlag,
  formatTime,
  reduced,
}: {
  post: ExPost;
  index: number;
  onClick: () => void;
  onLike: (id: string) => void;
  onRepost: (id: string, e: React.MouseEvent) => void;
  onShare: (id: string, e: React.MouseEvent) => void;
  onBookmark: (id: string, e: React.MouseEvent) => void;
  onFlag: (id: string, e: React.MouseEvent) => void;
  formatTime: (date: string) => string;
  reduced: boolean;
}) {
  const isClue = post.isClue === true;

  return (
    <motion.article
      layout
      initial={reduced ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SNAPPY}
      onClick={onClick}
      className={cn(
        'p-3 bg-ios-bg border-b border-ios-separator/10 cursor-pointer transition-colors',
        isClue && 'bg-ios-yellow/5 border-l-4 border-ios-yellow'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="size-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-purple to-ios-pink flex items-center justify-center text-[20px]">
          {post.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{post.author.name}</span>
            {post.author.verified && <Shield className="size-3.5 text-ios-green" aria-label="검증됨" />}
            <span className="text-ios-muted text-[13px]">@{post.author.handle}</span>
          </div>
          <p className="text-[12px] text-ios-muted">{formatTime(post.timestamp)}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onFlag(post.id, e); }} className="p-2 rounded-xl text-ios-muted hover:text-ios-red hover:bg-ios-red/10 shrink-0" aria-label="신고">
          <Flag className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="mt-3">
        <p className={cn('text-[15px] leading-relaxed whitespace-pre-wrap', isClue ? 'font-medium text-ios-yellow' : 'text-ios-text')}>
          {post.content}
        </p>
        {isClue && post.clueText && (
          <motion.div
            initial={reduced ? undefined : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 p-2 rounded-xl bg-ios-yellow/10 border border-ios-yellow/20 flex items-center gap-2"
          >
            <Zap className="size-3.5 text-ios-yellow shrink-0" />
            <span className="text-[12px] font-medium text-ios-yellow">단서 발견:</span>
            <span className="text-[12px] text-ios-text">{post.clueText}</span>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={e => { e.stopPropagation(); onLike(post.id); }}
            className={cn('flex items-center gap-1.5 p-1.5 rounded-xl transition-colors', post.liked ? 'text-ios-red' : 'text-ios-muted hover:text-ios-red hover:bg-ios-red/10')}
            aria-label={post.liked ? '좋아요 취소' : '좋아요'}
            aria-pressed={post.liked}
          >
            <Heart className={cn('size-5', post.liked ? 'fill-current' : '')} />
            {post.likes > 0 && <span className="text-[13px] tabular-nums">{post.likes > 999 ? '999+' : post.likes}</span>}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRepost(post.id, e); }}
            className="flex items-center gap-1.5 p-1.5 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/10"
            aria-label="리포스트"
          >
            <Repeat className="size-5" />
            {post.reposts > 0 && <span className="text-[13px] tabular-nums">{post.reposts > 999 ? '999+' : post.reposts}</span>}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onShare(post.id, e); }}
            className="flex items-center gap-1.5 p-1.5 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/10"
            aria-label="공유"
          >
            <Share2 className="size-5" />
            {post.replies > 0 && <span className="text-[13px] tabular-nums">{post.replies > 999 ? '999+' : post.replies}</span>}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onBookmark(post.id, e); }}
            className="flex items-center gap-1.5 p-1.5 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/10"
            aria-label="북마크"
          >
            <Bookmark className="size-5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function ExPostDetail({
  post,
  onClose,
  onLike,
  onRepost,
  onShare,
  onBookmark,
  onFlag,
  formatTime,
  gameDateTime,
}: {
  post: ExPost;
  onClose: () => void;
  onLike: (id: string) => void;
  onRepost: (id: string, e: React.MouseEvent) => void;
  onShare: (id: string, e: React.MouseEvent) => void;
  onBookmark: (id: string, e: React.MouseEvent) => void;
  onFlag: (id: string, e: React.MouseEvent) => void;
  formatTime: (date: string) => string;
  gameDateTime: string;
}) {
  const reduced = prefersReducedMotion();
  const isClue = post.isClue === true;

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: 50 }}
      transition={SPRING_SOFT}
      className="flex h-full flex-col"
    >
      {/* Detail Header */}
      <div className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-ios-separator/20 px-4 py-3">
        <button onClick={onClose} className="p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/15" aria-label="뒤로">
          <ChevronLeft className="size-5" />
        </button>
        <div className="size-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-purple to-ios-pink flex items-center justify-center text-[20px]">
          {post.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{post.author.name}</span>
            {post.author.verified && <Shield className="size-3.5 text-ios-green" />}
            <span className="text-ios-muted text-[13px]">@{post.author.handle}</span>
          </div>
          <p className="text-[12px] text-ios-muted">{formatTime(post.timestamp)}</p>
        </div>
        <button onClick={e => onFlag(post.id, e)} className="p-2 rounded-xl text-ios-muted hover:text-ios-red hover:bg-ios-red/10" aria-label="신고">
          <Flag className="size-4" />
        </button>
      </div>

      {/* Post Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <article className="max-w-2xl mx-auto">
          {isClue && post.clueText && (
            <motion.div
              initial={reduced ? undefined : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-xl bg-ios-yellow/10 border border-ios-yellow/20 flex items-start gap-2"
            >
              <Zap className="size-4 text-ios-yellow shrink-0" />
              <div>
                <p className="font-medium text-[13px] text-ios-yellow">💡 단서 발견</p>
                <p className="text-[13px] text-ios-text mt-0.5">{post.clueText}</p>
              </div>
            </motion.div>
          )}

          <div className="prose prose-ios dark:prose-invert max-w-none">
            <p className={cn('text-[16px] leading-relaxed whitespace-pre-wrap', isClue ? 'font-medium text-ios-yellow' : 'text-ios-text')}>
              {post.content}
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-ios-separator/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={e => onLike(post.id)}
                className={cn('flex items-center gap-1.5 p-2 rounded-xl transition-colors', post.liked ? 'text-ios-red bg-ios-red/10' : 'text-ios-muted hover:text-ios-red hover:bg-ios-red/10')}
                aria-label={post.liked ? '좋아요 취소' : '좋아요'}
                aria-pressed={post.liked}
              >
                <Heart className={cn('size-5', post.liked ? 'fill-current' : '')} />
                <span className="text-[14px] tabular-nums">{post.likes > 999 ? '999+' : post.likes}</span>
              </button>
              <button
                onClick={e => onRepost(post.id, e)}
                className="flex items-center gap-1.5 p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/10"
                aria-label="리포스트"
              >
                <Repeat className="size-5" />
                <span className="text-[14px] tabular-nums">{post.reposts > 999 ? '999+' : post.reposts}</span>
              </button>
              <button
                onClick={e => onShare(post.id, e)}
                className="flex items-center gap-1.5 p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/10"
                aria-label="공유"
              >
                <Share2 className="size-5" />
                <span className="text-[14px] tabular-nums">{post.replies > 999 ? '999+' : post.replies}</span>
              </button>
              <button
                onClick={e => onBookmark(post.id, e)}
                className="flex items-center gap-1.5 p-2 rounded-xl text-ios-muted hover:text-ios-text hover:bg-ios-separator/10"
                aria-label="북마크"
              >
                <Bookmark className="size-5" />
              </button>
            </div>
          </div>

          {/* Author bio */}
          <div className="mt-6 p-4 rounded-2xl bg-ios-surface ring-1 ring-black/5 dark:ring-white/5">
            <div className="flex items-center gap-3">
              <div className="size-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-ios-purple to-ios-pink flex items-center justify-center text-[24px]">
                {post.author.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{post.author.name}</span>
                  {post.author.verified && <Shield className="size-4 text-ios-green" />}
                </div>
                <p className="text-ios-muted text-[13px]">@{post.author.handle}</p>
                {post.author.bio && <p className="text-[13px] text-ios-text mt-1">{post.author.bio}</p>}
              </div>
            </div>
          </div>
        </article>
      </div>
    </motion.div>
  );
}