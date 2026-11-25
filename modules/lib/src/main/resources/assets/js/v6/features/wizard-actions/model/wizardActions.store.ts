import { atom } from 'nanostores';

export type WizardActionId =
    | 'save'
    | 'reset'
    | 'localize'
    | 'archive'
    | 'duplicate'
    | 'move'
    | 'preview'
    | 'markAsReady'
    | 'publish'
    | 'publishTree'
    | 'unpublish'
    | 'requestPublish'
    | 'openRequest'
    | 'createIssue';

export type WizardActionState = {
    label: string;
    enabled: boolean;
    visible: boolean;
};

export type WizardActionsState = Record<WizardActionId, WizardActionState>;

/** The legacy action that owns the state of a wizard action and runs it. */
export type WizardActionSource = {
    getLabel(): string;
    isEnabled(): boolean;
    isVisible(): boolean;
    execute(): void;
    onPropertyChanged(listener: () => void): void;
    unPropertyChanged(listener: () => void): void;
};

export type WizardActionSources = Record<WizardActionId, WizardActionSource>;

const mapWizardActions = <T>(map: (id: WizardActionId) => T): Record<WizardActionId, T> => ({
    save: map('save'),
    reset: map('reset'),
    localize: map('localize'),
    archive: map('archive'),
    duplicate: map('duplicate'),
    move: map('move'),
    preview: map('preview'),
    markAsReady: map('markAsReady'),
    publish: map('publish'),
    publishTree: map('publishTree'),
    unpublish: map('unpublish'),
    requestPublish: map('requestPublish'),
    openRequest: map('openRequest'),
    createIssue: map('createIssue'),
});

const createInitialState = (): WizardActionsState =>
    mapWizardActions(() => ({ label: '', enabled: false, visible: true }));

const readSource = (source: WizardActionSource): WizardActionState => ({
    label: source.getLabel(),
    enabled: source.isEnabled(),
    visible: source.isVisible(),
});

export const $wizardActions = atom<WizardActionsState>(createInitialState());

let boundSources: WizardActionSources | undefined;

let unbindSources: (() => void) | undefined;

/** Mirrors the legacy actions into the store until the next binding. */
export function bindWizardActions(sources: WizardActionSources): void {
    unbindSources?.();

    const listeners = mapWizardActions((id) => {
        const listener = (): void => {
            $wizardActions.set({ ...$wizardActions.get(), [id]: readSource(sources[id]) });
        };
        sources[id].onPropertyChanged(listener);
        return listener;
    });

    $wizardActions.set(mapWizardActions((id) => readSource(sources[id])));

    boundSources = sources;
    unbindSources = () => {
        mapWizardActions((id) => sources[id].unPropertyChanged(listeners[id]));
    };
}

export function unbindWizardActions(): void {
    unbindSources?.();
    unbindSources = undefined;
    boundSources = undefined;
    $wizardActions.set(createInitialState());
}

export function executeWizardAction(id: WizardActionId): void {
    boundSources?.[id].execute();
}
