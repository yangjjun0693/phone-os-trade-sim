import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { BellOff, X } from 'lucide-react';
import type { GameNotification } from '@/types';
import { getApp } from '@/apps/registry';
import { groupNotifications, visibleNotifications, type NotificationGroup } from '@/game/notifications';
import { useGameClock } from '@/hooks/useGameClock';
import { useGameStore } from '@/store/gameStore';
import { useOSStore } from '@/store/osStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { SPRING_BOUNCY, SPRING_SOFT, listItem, staggerContainer } from '@/utils/motion';
import { Wallpaper } from './Wallpaper';

/** How far left a card must be dragged before the swipe deletes it. */
const SWIPE_DELETE_DISTANCE = 60;

/** One grouped notification row: tap to open, swipe (or the ✕) to delete. */
function NotificationCard({
  group,
  onOpen,
  onOpenItem,
  onDelete,
}: {
  group: NotificationGroup;
  onOpen: (group: NotificationGroup) => void;
  onOpenItem: (item: GameNotification) => void;
  onDelete: (id: string) => void;
}) {
  const { latest } = group;
  // Spec §5.6 "그룹 펼치기": the card shows the latest; the count chip spills
  // the rest of the group underneath it.
  const [expanded, setExpanded] = useState(false);
  const rest = group.items.slice(1);

  // @use-gesture's `filterTaps` is deliberately off: it installs a capture-phase
  // `click` handler that `preventDefault()`+`stopPropagation()`s any click that
  // is not a detected tap, which swallows the card's tap-to-open click. Without
  // it the browser still fires a `click` after a real drag, so record the drag
  // and let the tap handler ignore that trailing click instead.
  const draggedRef = useRef(false);

  const bind = useDrag(
    ({ last, tap, movement: [mx] }) => {
      if (!last || tap) return;
      draggedRef.current = true;
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
      if (mx < -SWIPE_DELETE_DISTANCE) onDelete(latest.id);
    },
    { axis: 'x', touchAction: 'pan-y' },
  );

  const open = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    onOpen(group);
  };

  return (
    <motion.div
      layout
      variants={listItem}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.16 } }}
      className="relative"
    >
      <div
        {...bind()}
        className="glass-strong flex items-stretch overflow-hidden rounded-2xl text-ios-text shadow-lg ring-1 ring-inset ring-white/15"
      >
        <button
          type="button"
          onClick={open}
          className="flex min-w-0 flex-1 items-start gap-2.5 p-3 text-left"
        >
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-white/20 text-[11px]">
            {getApp(latest.appId)?.name.slice(0, 1) ?? '!'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold">{latest.title}</span>
              {group.unread > 0 && (
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full bg-ios-blue"
                />
              )}
              {rest.length > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-expanded={expanded}
                  aria-label={expanded ? '그룹 접기' : `그룹 펼치기 (${group.items.length})`}
                  onClick={(event) => {
                    // The chip sits inside the card's tap-to-open button; keep
                    // the toggle from also opening/deep-linking the group.
                    event.stopPropagation();
                    setExpanded((value) => !value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    setExpanded((value) => !value);
                  }}
                  className="shrink-0 rounded-full bg-white/20 px-1.5 text-[11px] tabular-nums"
                >
                  {group.items.length}
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[13px] opacity-80">{latest.body}</span>
          </span>
        </button>
        <button
          type="button"
          aria-label={`${latest.title} 삭제`}
          onClick={() => onDelete(latest.id)}
          className="flex w-8 shrink-0 items-center justify-center text-ios-muted active:bg-black/10"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {expanded && rest.length > 0 ? (
        <ul className="mt-1.5 flex flex-col gap-1.5 pl-3">
          {rest.map((item) => (
            <li
              key={item.id}
              className="glass-strong flex items-stretch overflow-hidden rounded-xl text-ios-text ring-1 ring-inset ring-white/10"
            >
              <button
                type="button"
                onClick={() => onOpenItem(item)}
                className="flex min-w-0 flex-1 flex-col p-2.5 text-left"
              >
                <span className="truncate text-[13px] font-semibold">{item.title}</span>
                <span className="mt-0.5 truncate text-[13px] opacity-80">{item.body}</span>
              </button>
              <button
                type="button"
                aria-label={`${item.title} 삭제`}
                onClick={() => onDelete(item.id)}
                className="flex w-8 shrink-0 items-center justify-center text-ios-muted active:bg-black/10"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </motion.div>
  );
}

/** Pull-down shade: game clock plus the grouped notification feed. */
export function NotificationCenter() {
  const notifications = useOSStore((s) => s.notifications);
  const notificationsOn = useTutorialStore((s) => s.notifications);
  const clearNotifications = useOSStore((s) => s.clearNotifications);
  const markNotificationRead = useOSStore((s) => s.markNotificationRead);
  const removeNotification = useOSStore((s) => s.removeNotification);
  const setOverlay = useOSStore((s) => s.setOverlay);
  const openApp = useOSStore((s) => s.openApp);
  const now = useGameStore((s) => s.gameDateTime);

  const list = notificationsOn ? notifications : [];
  const groups = groupNotifications(visibleNotifications(list, now));

  const { time, date } = useGameClock();

  // As in the card gesture, `filterTaps` is off (its click suppressor would
  // swallow the background button's dismiss). Record a completed dismiss drag
  // so the background button can ignore the trailing click the browser fires.
  const draggedRef = useRef(false);

  const bind = useDrag(
    ({ last, tap, movement: [, my], direction: [, dy], velocity: [, vy] }) => {
      if (!last || tap) return;
      draggedRef.current = true;
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
      if (my < -40 || (vy > 0.4 && dy < 0)) setOverlay('none');
    },
    { axis: 'y', touchAction: 'none' },
  );

  const dismiss = () => {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    setOverlay('none');
  };

  /** A tap always marks the notification read; only an action deep-links. */
  const openItem = (item: GameNotification) => {
    markNotificationRead(item.id);
    if (!item.action) return;
    getApp(item.action.appId)?.preload?.();
    openApp(item.action.appId);
    setOverlay('none');
  };

  const openGroup = (group: NotificationGroup) => openItem(group.latest);

  return (
    <motion.div
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={SPRING_SOFT}
      className="absolute inset-0 z-[45] isolate"
    >
      <Wallpaper />
      <div
        className="overlay-veil relative flex h-full w-full flex-col overflow-hidden"
        {...bind()}
      >
        {/* Tapping the background always dismisses, whatever the gesture does. */}
        <button
          type="button"
          aria-label="알림 닫기"
          onClick={dismiss}
          className="absolute inset-0 z-0"
        />
        <div className="relative z-10 flex items-start justify-between px-6 pt-[calc(var(--ios-statusbar-h)+10px)]">
          <div className="text-ios-text">
            <p className="text-[13px] font-medium opacity-70">{date}</p>
            <p className="text-[52px] font-bold leading-none tabular-nums">{time}</p>
          </div>
          <motion.button
            type="button"
            aria-label="알림 모두 지우기"
            onClick={clearNotifications}
            whileTap={{ scale: 0.86, rotate: 90 }}
            transition={SPRING_BOUNCY}
            className="mt-2 flex size-8 items-center justify-center rounded-full bg-black/10 text-ios-text"
          >
            <X className="size-4" aria-hidden />
          </motion.button>
        </div>

        <div className="scroll-area no-scrollbar relative z-10 mt-5 flex-1 px-4 pb-10">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-2 pt-16 text-ios-muted">
              <BellOff className="size-6" aria-hidden />
              <p className="text-[14px]">알림이 없습니다</p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer(0.05)}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-2"
            >
              <AnimatePresence initial={false}>
                {groups.map((group) => (
                  <NotificationCard
                    key={group.key}
                    group={group}
                    onOpen={openGroup}
                    onOpenItem={openItem}
                    onDelete={removeNotification}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
