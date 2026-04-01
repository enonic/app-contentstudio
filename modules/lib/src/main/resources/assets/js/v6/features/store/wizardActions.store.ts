import {atom} from 'nanostores';

//
// * State
//

export const $wizardDeleteOnlyMode = atom<boolean>(false);

export const $wizardContentCanBePublished = atom<boolean>(false);

export const $wizardUserCanPublish = atom<boolean>(true);

export const $wizardUserCanModify = atom<boolean>(true);

export const $wizardIsContentValid = atom<boolean>(false);

export const $wizardHasPublishRequest = atom<boolean>(false);

export const $wizardContentCanBeMarkedAsReady = atom<boolean>(false);

//
// * Public API
//

export function setWizardDeleteOnlyMode(value: boolean): void {
    $wizardDeleteOnlyMode.set(value);
}

export function setWizardContentCanBePublished(value: boolean): void {
    $wizardContentCanBePublished.set(value);
}

export function setWizardUserCanPublish(value: boolean): void {
    $wizardUserCanPublish.set(value);
}

export function setWizardUserCanModify(value: boolean): void {
    $wizardUserCanModify.set(value);
}

export function setWizardIsContentValid(value: boolean): void {
    $wizardIsContentValid.set(value);
}

export function setWizardHasPublishRequest(value: boolean): void {
    $wizardHasPublishRequest.set(value);
}

export function setWizardContentCanBeMarkedAsReady(value: boolean): void {
    $wizardContentCanBeMarkedAsReady.set(value);
}

export function resetWizardActions(): void {
    $wizardDeleteOnlyMode.set(false);
    $wizardContentCanBePublished.set(false);
    $wizardUserCanPublish.set(true);
    $wizardUserCanModify.set(true);
    $wizardIsContentValid.set(false);
    $wizardHasPublishRequest.set(false);
    $wizardContentCanBeMarkedAsReady.set(false);
}
