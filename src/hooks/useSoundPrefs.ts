import { useEffect } from 'react';
import { sound } from '@/lib/sound';
import { useOSStore } from '@/store/osStore';
import { useTutorialStore } from '@/store/tutorialStore';

/**
 * Keep the synth in step with the OS: the onboarding/settings sound consent is
 * the mute switch, and the control-centre slider is the master volume.
 * Mounted once at the app root.
 */
export function useSoundPrefs(): void {
  const enabled = useTutorialStore((s) => s.sound);
  const volume = useOSStore((s) => s.controls.volume);

  useEffect(() => {
    sound.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    sound.setVolume(volume);
  }, [volume]);
}
