import {atom} from 'nanostores';

//
// * Types
//

export type WizardViewMode = 'form' | 'split' | 'live';

//
// * State
//

export const $wizardViewMode = atom<WizardViewMode>('form');

export const $wizardInMobileViewMode = atom<boolean>(false);

//
// * Public API
//

export function showWizardForm(): void {
    $wizardViewMode.set('form');
}

export function showWizardLiveEdit(): void {
    const mode = $wizardInMobileViewMode.get() ? 'live' : 'split';
    $wizardViewMode.set(mode);
}

export function setWizardViewMode(mode: WizardViewMode): void {
    $wizardViewMode.set(mode);
}

export function setWizardInMobileViewMode(value: boolean): void {
    $wizardInMobileViewMode.set(value);
}

export function resetWizardViewMode(): void {
    $wizardViewMode.set('form');
    $wizardInMobileViewMode.set(false);
}
