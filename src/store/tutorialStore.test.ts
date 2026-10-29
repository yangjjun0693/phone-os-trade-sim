import { beforeEach, describe, expect, it } from 'vitest';
import { TUTORIAL_STEPS } from '@/content/tutorial';
import { useTutorialStore } from './tutorialStore';

const total = TUTORIAL_STEPS.length;

beforeEach(() => {
  useTutorialStore.getState().reset();
});

describe('tutorial store', () => {
  it('starts before the intro and hides the guide', () => {
    const state = useTutorialStore.getState();
    expect(state.introSeen).toBe(false);
    expect(state.setupDone).toBe(false);
    expect(state.active).toBe(false);
    expect(state.stepIndex).toBe(0);
    expect(state.openedApps).toEqual([]);
  });

  it('commits the setup once and starts at the first unfinished step', () => {
    useTutorialStore.getState().completeSetup({
      deviceName: '  테스트폰  ',
      defaultIdentity: 'realname',
      notifications: false,
      sound: false,
    });

    const state = useTutorialStore.getState();
    expect(state.introSeen).toBe(true);
    expect(state.setupDone).toBe(true);
    expect(state.active).toBe(true);
    expect(state.deviceName).toBe('테스트폰');
    expect(state.defaultIdentity).toBe('realname');
    expect(state.notifications).toBe(false);
    expect(state.sound).toBe(false);
    expect(state.stepIndex).toBe(0);
  });

  it('records each opened app once', () => {
    const store = useTutorialStore.getState();
    store.noteOpenedApp('news');
    store.noteOpenedApp('news');
    store.noteOpenedApp('trade');

    expect(useTutorialStore.getState().openedApps).toEqual(['news', 'trade']);
  });

  it('ignores unknown step ids', () => {
    const store = useTutorialStore.getState();
    store.completeStep('not-a-step');

    expect(useTutorialStore.getState().done).toEqual([]);
    expect(useTutorialStore.getState().stepIndex).toBe(0);
  });

  it('advances to the earliest unfinished step', () => {
    const store = useTutorialStore.getState();
    store.completeStep('sell');

    // 'sell' is step 4; the guide resumes at the earliest gap, step 1.
    expect(useTutorialStore.getState().stepIndex).toBe(0);

    store.completeStep('buy');
    expect(useTutorialStore.getState().stepIndex).toBe(1);
    expect(useTutorialStore.getState().done).toEqual(['sell', 'buy']);
  });

  it('lands on the completion index when every step is done', () => {
    const store = useTutorialStore.getState();
    TUTORIAL_STEPS.forEach((step) => store.completeStep(step.id));

    expect(useTutorialStore.getState().done).toHaveLength(total);
    expect(useTutorialStore.getState().stepIndex).toBe(total);
  });

  it('stops and resumes without losing progress', () => {
    const store = useTutorialStore.getState();
    store.completeStep('buy');
    store.stopGuide();
    expect(useTutorialStore.getState().active).toBe(false);

    store.startGuide();
    expect(useTutorialStore.getState().active).toBe(true);
    expect(useTutorialStore.getState().stepIndex).toBe(1);
  });

  it('restarts from scratch and clears visited apps', () => {
    const store = useTutorialStore.getState();
    store.noteOpenedApp('news');
    store.completeStep('news');
    store.stopGuide();

    store.restartGuide();

    const state = useTutorialStore.getState();
    expect(state.active).toBe(true);
    expect(state.done).toEqual([]);
    expect(state.openedApps).toEqual([]);
    expect(state.stepIndex).toBe(0);
  });

  it('clamps manual step navigation', () => {
    const store = useTutorialStore.getState();
    store.goToStep(-4);
    expect(useTutorialStore.getState().stepIndex).toBe(0);

    store.goToStep(999);
    expect(useTutorialStore.getState().stepIndex).toBe(total);
  });

  it('trims the device name and refuses blanks', () => {
    const store = useTutorialStore.getState();
    store.setDeviceName('  주머니폰  ');
    expect(useTutorialStore.getState().deviceName).toBe('주머니폰');

    store.setDeviceName('   ');
    expect(useTutorialStore.getState().deviceName).toBe('주머니폰');
  });

  it('keeps device preferences separate from the guide', () => {
    const store = useTutorialStore.getState();
    store.completeSetup({ deviceName: '테스트폰', notifications: false });

    store.reset();

    const state = useTutorialStore.getState();
    expect(state.setupDone).toBe(false);
    expect(state.notifications).toBe(true);
    expect(state.deviceName).toBe('의 iPhone');
  });
});
