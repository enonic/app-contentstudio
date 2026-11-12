import type { ContentSummary } from '../../../../app/content/ContentSummary';

//
// * Wizard Controller
//
// What the v6 wizard commands still need from the legacy `ContentWizardPanel`.
// The panel registers itself; the commands never import it.
//

export type LegacyWizardActionId = 'reset' | 'localize';

export type WizardController = {
    getPersistedContent: () => ContentSummary | undefined;
    hasUnsavedChanges: () => boolean;
    /** Resolves with the saved content, or with `undefined` when nothing was saved. */
    save: () => Promise<ContentSummary | undefined>;
    close: () => void;
    isMarkedAsReady: () => boolean;
    setMarkedAsReady: (value: boolean) => void;
    /** Runs an action that is not a command yet. */
    executeLegacy: (id: LegacyWizardActionId) => void;
};

let controller: WizardController | undefined;

export function registerWizardController(next: WizardController): () => void {
    controller = next;

    return () => {
        if (controller === next) controller = undefined;
    };
}

export function getWizardController(): WizardController | undefined {
    return controller;
}
