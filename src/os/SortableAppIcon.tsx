import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AppMeta } from '@/types';
import { cn } from '@/utils/cn';
import { AppIcon } from './AppIcon';

interface SortableAppIconProps {
  app: AppMeta;
  editable: boolean;
  onOpen?: () => void;
  onLongPress?: () => void;
  jiggleDelay?: number;
  /** When set, the icon springs in from below on mount (staggered). */
  entranceDelay?: number;
  showLabel?: boolean;
}

/**
 * dnd-kit wrapper. Drag handles are only wired up in edit mode so that normal
 * taps stay instant on the home screen.
 */
export function SortableAppIcon({
  app,
  editable,
  onOpen,
  onLongPress,
  jiggleDelay,
  entranceDelay,
  showLabel = true,
}: SortableAppIconProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: app.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.75 : 1,
        zIndex: isDragging ? 30 : undefined,
        animationDelay: entranceDelay !== undefined ? `${entranceDelay}ms` : undefined,
      }}
      className={cn('touch-none', entranceDelay !== undefined && 'animate-rise-in')}
      {...(editable ? attributes : {})}
      {...(editable ? listeners : {})}
    >
      <AppIcon
        app={app}
        editable={editable}
        jiggleDelay={jiggleDelay}
        showLabel={showLabel}
        shared={!editable && !isDragging}
        onOpen={onOpen}
        onLongPress={onLongPress}
      />
    </div>
  );
}
