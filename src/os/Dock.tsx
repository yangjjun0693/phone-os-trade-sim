import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { getApp } from '@/apps/registry';
import { cn } from '@/utils/cn';
import { APP_ICON_SIZE } from './metrics';
import { SortableAppIcon } from './SortableAppIcon';

interface DockProps {
  appIds: string[];
  editable: boolean;
  onOpen: (appId: string) => void;
  onLongPress: (appId: string) => void;
}

/** Frosted dock: 4 slots, blurred backdrop, icons slightly smaller than home. */
export function Dock({ appIds, editable, onOpen, onLongPress }: DockProps) {
  const { setNodeRef } = useDroppable({ id: 'dock', disabled: !editable });
  const apps = appIds.map(getApp).filter((app): app is NonNullable<typeof app> => Boolean(app));

  return (
    <div className="px-3 pb-2 pt-1">
      <div
        ref={setNodeRef}
        className={cn(
          'glass mx-auto rounded-[30px] px-2 py-2.5 shadow-lg ring-1 ring-inset ring-white/15',
          editable && 'ring-ios-accent/40',
        )}
      >
        <SortableContext items={appIds} strategy={rectSortingStrategy}>
          <div className="flex items-start justify-around">
            {apps.map((app) => (
              <SortableAppIcon
                key={app.id}
                app={app}
                editable={editable}
                jiggleDelay={90}
                showLabel={false}
                onOpen={() => onOpen(app.id)}
                onLongPress={() => onLongPress(app.id)}
              />
            ))}
            {/* Keep the dock from reflowing when it holds fewer than 4 apps. */}
            {Array.from({ length: Math.max(0, 4 - apps.length) }).map((_, index) => (
              <span
                key={`spacer-${index}`}
                style={{ width: 70, height: APP_ICON_SIZE }}
                aria-hidden
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
