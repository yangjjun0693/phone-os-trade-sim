import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { IdentityKind } from '@/types';
import { TUTORIAL_STEPS } from '@/content/tutorial';
import { firstUnfinishedStep } from '@/game/tutorial';

/**
 * Onboarding + guide state. Kept out of the game save on purpose:
 *  - device setup (name, consent) belongs to the device, not the run
 *  - the guide survives a new run ("이미 배운 것"은 다시 묻지 않음)
 * The Settings app exposes "가이드 다시 보기", which resets only the guide.
 */
export const TUTORIAL_PERSIST_VERSION = 1;

export interface SetupInput {
  deviceName: string;
  /** Which identity the guide recommends (not auto-applied to every app). */
  defaultIdentity: IdentityKind;
  notifications: boolean;
  sound: boolean;
}

export interface TutorialState {
  /** Intro greeting sequence finished (or was skipped). */
  introSeen: boolean;
  /** Name / identity / device / consent completed (or skipped). */
  setupDone: boolean;
  /** Guide card visible. */
  active: boolean;
  /** Index into `TUTORIAL_STEPS`. May equal `TUTORIAL_STEPS.length` when done. */
  stepIndex: number;
  /** Step ids the player has finished. */
  done: string[];
  /** Apps the player has opened (drives "open this app" steps). */
  openedApps: string[];
  deviceName: string;
  defaultIdentity: IdentityKind;
  notifications: boolean;
  sound: boolean;

  markIntroSeen: () => void;
  completeSetup: (input: Partial<SetupInput>) => void;
  startGuide: () => void;
  stopGuide: () => void;
  restartGuide: () => void;
  completeStep: (id: string) => void;
  goToStep: (index: number) => void;
  /** Called by the OS whenever an app is opened. */
  noteOpenedApp: (appId: string) => void;
  setDeviceName: (name: string) => void;
  setDefaultIdentity: (identity: IdentityKind) => void;
  setNotifications: (enabled: boolean) => void;
  setSound: (enabled: boolean) => void;
  reset: () => void;
}

function defaults(): Pick<
  TutorialState,
  | 'introSeen'
  | 'setupDone'
  | 'active'
  | 'stepIndex'
  | 'done'
  | 'openedApps'
  | 'deviceName'
  | 'defaultIdentity'
  | 'notifications'
  | 'sound'
> {
  return {
    introSeen: false,
    setupDone: false,
    active: false,
    stepIndex: 0,
    done: [],
    openedApps: [],
    deviceName: '의 iPhone',
    defaultIdentity: 'alias',
    notifications: true,
    sound: true,
  };
}

type PersistedTutorial = Omit<
  TutorialState,
  | 'markIntroSeen'
  | 'completeSetup'
  | 'startGuide'
  | 'stopGuide'
  | 'restartGuide'
  | 'completeStep'
  | 'goToStep'
  | 'noteOpenedApp'
  | 'setDeviceName'
  | 'setDefaultIdentity'
  | 'setNotifications'
  | 'setSound'
  | 'reset'
>;

export const useTutorialStore = create<TutorialState>()(
  persist(
    immer((set) => ({
      ...defaults(),

      markIntroSeen: () =>
        set((s) => {
          s.introSeen = true;
        }),

      completeSetup: (input) =>
        set((s) => {
          if (typeof input.deviceName === 'string' && input.deviceName.trim()) {
            s.deviceName = input.deviceName.trim().slice(0, 32);
          }
          if (input.defaultIdentity) s.defaultIdentity = input.defaultIdentity;
          if (typeof input.notifications === 'boolean') s.notifications = input.notifications;
          if (typeof input.sound === 'boolean') s.sound = input.sound;
          s.introSeen = true;
          s.setupDone = true;
          s.active = true;
          s.stepIndex = firstUnfinishedStep(s.done, TUTORIAL_STEPS);
        }),

      startGuide: () =>
        set((s) => {
          s.active = true;
          s.stepIndex = firstUnfinishedStep(s.done, TUTORIAL_STEPS);
        }),

      stopGuide: () =>
        set((s) => {
          s.active = false;
        }),

      restartGuide: () =>
        set((s) => {
          s.active = true;
          s.done = [];
          s.openedApps = [];
          s.stepIndex = 0;
        }),

      completeStep: (id) =>
        set((s) => {
          if (!TUTORIAL_STEPS.some((step) => step.id === id)) return;
          if (!s.done.includes(id)) s.done.push(id);
          s.stepIndex = firstUnfinishedStep(s.done, TUTORIAL_STEPS);
        }),

      goToStep: (index) =>
        set((s) => {
          s.stepIndex = Math.min(TUTORIAL_STEPS.length, Math.max(0, Math.trunc(index)));
        }),

      noteOpenedApp: (appId) =>
        set((s) => {
          if (!appId || s.openedApps.includes(appId)) return;
          s.openedApps.push(appId);
        }),

      setDeviceName: (name) =>
        set((s) => {
          const trimmed = name.trim();
          if (trimmed) s.deviceName = trimmed.slice(0, 32);
        }),

      setDefaultIdentity: (identity) =>
        set((s) => {
          s.defaultIdentity = identity;
        }),

      setNotifications: (enabled) =>
        set((s) => {
          s.notifications = enabled;
        }),

      setSound: (enabled) =>
        set((s) => {
          s.sound = enabled;
        }),

      reset: () => set(() => defaults()),
    })),
    {
      name: 'phone-os:tutorial',
      version: TUTORIAL_PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedTutorial => ({
        introSeen: state.introSeen,
        setupDone: state.setupDone,
        active: state.active,
        stepIndex: state.stepIndex,
        done: state.done,
        openedApps: state.openedApps,
        deviceName: state.deviceName,
        defaultIdentity: state.defaultIdentity,
        notifications: state.notifications,
        sound: state.sound,
      }),
      migrate: (persisted) => {
        const previous = (persisted ?? {}) as Partial<PersistedTutorial>;
        return { ...defaults(), ...previous } as PersistedTutorial;
      },
    },
  ),
);
