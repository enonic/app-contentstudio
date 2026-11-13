import { atom, computed } from 'nanostores';

//
// * State
//

export type InspectSave = {
    enabled: boolean;
    execute: () => void;
};

// Set by the wizard toolbar: the inspector applies its form by saving the content.
const $inspectSave = atom<InspectSave | null>(null);

export const $inspectFormPresent = atom<boolean>(false);

//
// * Computed
//

export const $isApplyVisible = computed($inspectFormPresent, (present): boolean => present);

export const $isApplyEnabled = computed(
    [$inspectFormPresent, $inspectSave],
    (present, save): boolean => present && save?.enabled === true,
);

//
// * Commands
//

export function setInspectSave(save: InspectSave | null): void {
    $inspectSave.set(save);
}

export function setInspectFormPresent(present: boolean): void {
    $inspectFormPresent.set(present);
}

export function resetInspectFormTracking(): void {
    $inspectFormPresent.set(false);
}

export function executeInspectSave(): void {
    const save = $inspectSave.get();
    if (save?.enabled) {
        save.execute();
    }
}
