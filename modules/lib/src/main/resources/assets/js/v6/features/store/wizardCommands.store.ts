import {atom} from 'nanostores';

//
// * Types
//

type CloseHandler = (checkCanClose?: boolean) => void;

//
// * State
//

/**
 * Handler for wizard close. Registered by ContentWizardPanel at initialization.
 */
export const $wizardCloseHandler = atom<CloseHandler | null>(null);

/**
 * Signals that content was just localized. Panel subscribes to react with UI work.
 */
export const $wizardLocalizeCompleted = atom<boolean>(false);

/**
 * Signals that content inheritance was just reset. Panel subscribes to react with UI work.
 */
export const $wizardResetCompleted = atom<boolean>(false);

//
// * Public API
//

export function setWizardCloseHandler(handler: CloseHandler): void {
    $wizardCloseHandler.set(handler);
}

export function requestWizardClose(checkCanClose: boolean = true): void {
    const handler = $wizardCloseHandler.get();
    if (handler) {
        handler(checkCanClose);
    }
}

export function notifyWizardLocalized(): void {
    $wizardLocalizeCompleted.set(true);
}

export function notifyWizardReset(): void {
    $wizardResetCompleted.set(true);
}

export function resetWizardCommands(): void {
    $wizardCloseHandler.set(null);
    $wizardLocalizeCompleted.set(false);
    $wizardResetCompleted.set(false);
}
