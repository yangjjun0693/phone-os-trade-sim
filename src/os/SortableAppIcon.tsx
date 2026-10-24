import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AppMeta } from '@/types';
import { AppIcon } from './AppIcon';

interface SortableAppIconProps {
  app: AppMeta;
  editable: boolean;
  onOpen?: () => void;
  onLongPress?: () => void;
  jiggleDelay?: number;
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
      }}
      className="touch-none"
      {...(editable ? attributes : {})}
      {...(editable ? listeners : {})}
    >
      <AppIcon
        app={app}
        editable={editable}
        jiggleDelay={jiggleDelay}
        shared={!editable && !isDragging}
        onOpen={onOpen}
        onLongPress={onLongPress}
      />
    </div>
  );
}
