import type {Action} from '@enonic/lib-admin-ui/ui/Action';
import {atom, computed} from 'nanostores';

//
// * State
//

export const $inspectSaveAction = atom<Action | null>(null);

export const $inspectFormPresent = atom<boolean>(false);

export const $inspectFormDirty = atom<boolean>(false);

export const $inspectFormValid = atom<boolean>(true);

//
// * Computed
//

export const $isApplyVisible = computed($inspectFormPresent, (present): boolean => present);

export const $isApplyEnabled = computed(
    [$inspectFormPresent, $inspectFormDirty, $inspectFormValid, $inspectSaveAction],
    (present, dirty, valid, action): boolean => present && dirty && valid && action != null,
);

//
// * Commands
//

export function setInspectSaveAction(action: Action | null): void {
    $inspectSaveAction.set(action);
}

export function setInspectFormPresent(present: boolean): void {
    $inspectFormPresent.set(present);
}

export function setInspectFormDirty(dirty: boolean): void {
    $inspectFormDirty.set(dirty);
}

export function setInspectFormValid(valid: boolean): void {
    $inspectFormValid.set(valid);
}

export function resetInspectFormTracking(): void {
    $inspectFormPresent.set(false);
    $inspectFormDirty.set(false);
    $inspectFormValid.set(true);
}

export function executeInspectSave(): void {
    const action = $inspectSaveAction.get();
    if (action != null && action.isEnabled()) {
        action.execute();
    }
}
