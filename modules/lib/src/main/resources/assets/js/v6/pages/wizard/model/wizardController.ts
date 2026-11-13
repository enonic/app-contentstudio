import type { Content } from '../../../../app/content/Content';
import type { ContentSummary } from '../../../../app/content/ContentSummary';

//
// * Wizard Controller
//
// What the v6 wizard commands still need from the legacy `ContentWizardPanel`.
// The panel registers itself; the commands never import it.
//

export type WizardSaveOptions = {
    /** The save is a rename confirmed in the toolbar, which has its own message. */
    renamed?: boolean;
    /** `false` leaves the page editor as it is; the caller reloads what it needs. */
    reloadPageEditor?: boolean;
    /** Drops the page editor's inspection when it reloads. */
    clearInspection?: boolean;
};

export type WizardController = {
    getPersistedContent: () => ContentSummary | undefined;
    hasUnsavedChanges: () => boolean;
    /** Resolves with the saved content, or with `undefined` when nothing was saved. */
    save: (options?: WizardSaveOptions) => Promise<ContentSummary | undefined>;
    close: () => void;
    /** Takes the content after its inheritance was reset or it was localized, and locks or unlocks the wizard. */
    replaceContent: (content: Content, editable: boolean) => Promise<void>;
    openTranslator: (language: string) => void;
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
