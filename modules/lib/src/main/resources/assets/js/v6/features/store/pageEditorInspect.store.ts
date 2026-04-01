import {atom, computed} from 'nanostores';
import type {ComponentPath} from '../../../app/page/region/ComponentPath';

//
// * State
//

export const $inspectedPath = atom<string | null>(null);

//
// * Computed
//

export const $isInspecting = computed($inspectedPath, (path): boolean => path != null);

//
// * Actions
//

export function inspectComponent(path: ComponentPath | null): void {
    $inspectedPath.set(path ? path.toString() : null);
}

export function clearInspection(): void {
    $inspectedPath.set(null);
}
