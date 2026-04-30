import type {Action} from '@enonic/lib-admin-ui/ui/Action';
import {atom, computed} from 'nanostores';

//
// * State
//

export const $inspectSaveAction = atom<Action | null>(null);

export const $inspectFormPresent = atom<boolean>(false);

const $inspectSaveActionEnabled = atom<boolean>(false);

//
// * Computed
//

export const $isApplyVisible = computed($inspectFormPresent, (present): boolean => present);

export const $isApplyEnabled = computed(
    [$inspectFormPresent, $inspectSaveActionEnabled],
    (present, enabled): boolean => present && enabled,
);

//
// * Commands
//

let unsubscribeSaveAction: (() => void) | null = null;

export function setInspectSaveAction(action: Action | null): void {
    unsubscribeSaveAction?.();
    unsubscribeSaveAction = null;

    $inspectSaveAction.set(action);

    if (action == null) {
        $inspectSaveActionEnabled.set(false);
        return;
    }

    const sync = (): void => {
        $inspectSaveActionEnabled.set(action.isEnabled());
    };

    sync();
    action.onPropertyChanged(sync);
    unsubscribeSaveAction = () => action.unPropertyChanged(sync);
}

export function setInspectFormPresent(present: boolean): void {
    $inspectFormPresent.set(present);
}

export function resetInspectFormTracking(): void {
    $inspectFormPresent.set(false);
}

export function executeInspectSave(): void {
    const action = $inspectSaveAction.get();
    if (action != null && action.isEnabled()) {
        action.execute();
    }
}
