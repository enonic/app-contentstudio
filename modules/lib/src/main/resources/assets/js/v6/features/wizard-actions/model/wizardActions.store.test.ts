import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    $wizardActions,
    bindWizardActions,
    executeWizardAction,
    unbindWizardActions,
    type WizardActionId,
    type WizardActionSource,
} from './wizardActions.store';

type FakeSource = WizardActionSource & {
    set(state: { label?: string; enabled?: boolean; visible?: boolean }): void;
    listenerCount(): number;
};

const createSource = (label: string): FakeSource => {
    let state = { label, enabled: false, visible: true };
    const listeners = new Set<() => void>();

    return {
        getLabel: () => state.label,
        isEnabled: () => state.enabled,
        isVisible: () => state.visible,
        execute: vi.fn(),
        onPropertyChanged: (listener) => listeners.add(listener),
        unPropertyChanged: (listener) => listeners.delete(listener),
        set: (next) => {
            state = { ...state, ...next };
            listeners.forEach((listener) => listener());
        },
        listenerCount: () => listeners.size,
    };
};

const createSources = (): Record<WizardActionId, FakeSource> => ({
    save: createSource('save'),
    reset: createSource('reset'),
    localize: createSource('localize'),
    archive: createSource('archive'),
    duplicate: createSource('duplicate'),
    move: createSource('move'),
    preview: createSource('preview'),
    markAsReady: createSource('markAsReady'),
    publish: createSource('publish'),
    publishTree: createSource('publishTree'),
    unpublish: createSource('unpublish'),
    requestPublish: createSource('requestPublish'),
    openRequest: createSource('openRequest'),
    createIssue: createSource('createIssue'),
});

const totalListeners = (sources: Record<WizardActionId, FakeSource>): number =>
    Object.values(sources).reduce((sum, source) => sum + source.listenerCount(), 0);

describe('wizardActions.store', () => {
    afterEach(() => {
        unbindWizardActions();
        vi.restoreAllMocks();
    });

    it('should read the state of every action on binding', () => {
        const sources = createSources();
        sources.save.set({ label: 'Saved', enabled: true });
        sources.move.set({ visible: false });

        bindWizardActions(sources);

        expect($wizardActions.get().save).toEqual({ label: 'Saved', enabled: true, visible: true });
        expect($wizardActions.get().move).toEqual({ label: 'move', enabled: false, visible: false });
        expect(totalListeners(sources)).toBe(14);
    });

    it('should follow later changes of an action', () => {
        const sources = createSources();
        bindWizardActions(sources);

        sources.publish.set({ enabled: true, label: 'Publish...' });

        expect($wizardActions.get().publish).toEqual({ label: 'Publish...', enabled: true, visible: true });
    });

    it('should run the bound action whatever its state', () => {
        const sources = createSources();
        bindWizardActions(sources);

        executeWizardAction('archive');

        expect(sources.archive.execute).toHaveBeenCalledTimes(1);
    });

    it('should drop the previous actions on rebinding', () => {
        const previous = createSources();
        const next = createSources();
        bindWizardActions(previous);

        bindWizardActions(next);
        previous.save.set({ enabled: true });
        executeWizardAction('save');

        expect(totalListeners(previous)).toBe(0);
        expect($wizardActions.get().save.enabled).toBe(false);
        expect(previous.save.execute).not.toHaveBeenCalled();
        expect(next.save.execute).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe and reset on unbinding', () => {
        const sources = createSources();
        sources.save.set({ enabled: true });
        bindWizardActions(sources);

        unbindWizardActions();
        executeWizardAction('save');

        expect(totalListeners(sources)).toBe(0);
        expect($wizardActions.get().save).toEqual({ label: '', enabled: false, visible: true });
        expect(sources.save.execute).not.toHaveBeenCalled();
    });
});
