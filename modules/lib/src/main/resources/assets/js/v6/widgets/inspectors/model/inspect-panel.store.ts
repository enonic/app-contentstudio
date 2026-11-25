import { atom, computed } from 'nanostores';
import { $wizardActions, executeWizardAction } from '../../../features/wizard-actions/model/wizardActions.store';

//
// * State
//

export const $inspectFormPresent = atom<boolean>(false);

//
// * Computed
//

export const $isApplyVisible = computed($inspectFormPresent, (present): boolean => present);

export const $isApplyEnabled = computed(
    [$inspectFormPresent, $wizardActions],
    (present, actions): boolean => present && actions.save.enabled,
);

//
// * Commands
//

export function setInspectFormPresent(present: boolean): void {
    $inspectFormPresent.set(present);
}

export function resetInspectFormTracking(): void {
    $inspectFormPresent.set(false);
}

export function executeInspectSave(): void {
    if ($wizardActions.get().save.enabled) {
        executeWizardAction('save');
    }
}
