import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { ExPost } from './MessengerTypes';

export function useExAppHandlers(
  setPosts: React.Dispatch<React.SetStateAction<ExPost[]>>
) {
  const toggleLike = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  }, []);

  const toggleBookmark = useCallback((postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return p;
      }
      return p;
    }));
  }, []);

  const handleRepost = useCallback((postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, reposts: p.reposts + 1 };
      }
      return p;
    }));
  }, []);

  const handleShare = useCallback((postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Share sheet would open
  }, []);

  const handleFlag = useCallback((postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Report post
  }, []);

  return {
    toggleLike,
    toggleBookmark,
    handleRepost,
    handleShare,
    handleFlag,
  };
}