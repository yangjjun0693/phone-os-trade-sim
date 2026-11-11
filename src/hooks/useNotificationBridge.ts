import { useEffect } from 'react';
import { onGameEvent } from '@/lib/notificationBus';
import { channelsFor } from '@/game/notifications';
import { sound } from '@/lib/sound';
import { haptic } from '@/utils/haptics';
import { useOSStore } from '@/store/osStore';

/**
 * Turns domain events into notifications and fires the matching non-visual
 * channels (haptics / sound). Mounted once at the app root: it subscribes to
 * the event bus for the lifetime of the component and lets `osStore.notify`
 * decide what actually lands in the centre.
 */
export function useNotificationBridge(): void {
  useEffect(
    () =>
      onGameEvent((event) => {
        const delivered = useOSStore.getState().notify(event);
        const cue = event.type === 'messenger.arrival' ? 'message' : 'notify';
        for (const item of delivered) {
          const ch = channelsFor(item.priority);
          if (ch.haptic) haptic(12);
          if (ch.sound) sound.play(cue);
        }
      }),
    [],
  );
}
