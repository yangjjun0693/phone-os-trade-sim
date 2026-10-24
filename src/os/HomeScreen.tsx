import { useCallback, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Check } from 'lucide-react';
import { getApp } from '@/apps/registry';
import { useOSStore } from '@/store/osStore';
import { cn } from '@/utils/cn';
import { haptic } from '@/utils/haptics';
import { Dock } from './Dock';
import { SortableAppIcon } from './SortableAppIcon';
import { ClockWidget } from './widgets/ClockWidget';
import { SummaryWidget } from './widgets/SummaryWidget';

function Page({
  pageIndex,
  appIds,
  editable,
  onOpen,
  onLongPress,
}: {
  pageIndex: number;
  appIds: string[];
  editable: boolean;
  onOpen: (appId: string) => void;
  onLongPress: (appId: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `page:${pageIndex}`, disabled: !editable });
  const apps = appIds
    .map(getApp)
    .filter((app): app is NonNullable<ReturnType<typeof getApp>> => Boolean(app));

  return (
    <div ref={setNodeRef} className="h-full w-full shrink-0 px-6 pt-1">
      <SortableContext items={appIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-4 justify-items-center gap-x-[26px] gap-y-[22px]">
          {apps.map((app, index) => (
            <SortableAppIcon
              key={app.id}
              app={app}
              editable={editable}
              jiggleDelay={(index * 43) % 180}
              onOpen={() => onOpen(app.id)}
              onLongPress={() => onLongPress(app.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

/**
 * Home screen: widgets, paged icon grid, page dots and the dock.
 *
 * Paging is a horizontal drag on the grid area. While arranging icons the
 * pager is disabled so dnd-kit owns the pointer.
 */
export function HomeScreen() {
  const layout = useOSStore((s) => s.layout);
  const editing = useOSStore((s) => s.editing);
  const openApp = useOSStore((s) => s.openApp);
  const setEditing = useOSStore((s) => s.setEditing);
  const moveApp = useOSStore((s) => s.moveApp);

  const [page, setPage] = useState(0);
  const pageRef = useRef(0);
  pageRef.current = page;

  const pageCount = Math.max(1, layout.pages.length);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const goToPage = useCallback(
    (next: number) => {
      const clamped = Math.min(pageCount - 1, Math.max(0, next));
      if (clamped !== pageRef.current) {
        haptic(4);
        setPage(clamped);
      }
    },
    [pageCount],
  );

  const bindPager = useDrag(
    ({ last, tap, movement: [mx], direction: [dx], velocity: [vx] }) => {
      if (!last || tap) return;
      const threshold = 55;
      if (dx > 0 && (mx > threshold || vx > 0.35)) goToPage(pageRef.current - 1);
      else if (dx < 0 && (mx < -threshold || vx > 0.35)) goToPage(pageRef.current + 1);
    },
    { axis: 'x', filterTaps: true, enabled: !editing, touchAction: 'pan-y' },
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) moveApp(String(active.id), String(over.id));
  };

  const startEditing = () => {
    haptic(10);
    setEditing(true);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      autoScroll={false}
    >
      <div
        className="relative flex h-full flex-col"
        style={{ background: 'var(--os-wallpaper)' }}
      >
        <div className="shrink-0 pt-[var(--ios-statusbar-h)]" />

        <div className="grid shrink-0 grid-cols-2 gap-3 px-4 pb-1 pt-2">
          <ClockWidget />
          <SummaryWidget />
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden" {...bindPager()}>
          <div
            className="flex h-full transition-transform duration-300 ease-ios"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {layout.pages.map((appIds, index) => (
              <Page
                key={`page-${index}`}
                pageIndex={index}
                appIds={appIds}
                editable={editing}
                onOpen={openApp}
                onLongPress={startEditing}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center gap-2 pb-1 pt-2 mix-blend-difference">
          {Array.from({ length: pageCount }).map((_, index) => (
            <span
              key={`dot-${index}`}
              className={cn(
                'size-[7px] rounded-full bg-white transition-opacity',
                index === page ? 'opacity-100' : 'opacity-35',
              )}
            />
          ))}
        </div>

        <Dock
          appIds={layout.dock}
          editable={editing}
          onOpen={openApp}
          onLongPress={startEditing}
        />

        {editing ? (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="glass-strong absolute right-4 top-[var(--ios-statusbar-h)] z-50 flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-semibold text-ios-text shadow-lg"
          >
            <Check className="size-4" aria-hidden />
            완료
          </button>
        ) : null}
      </div>
    </DndContext>
  );
}
