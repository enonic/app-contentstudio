import {atom, computed} from 'nanostores';
import {ComponentPath} from '../../../app/page/region/ComponentPath';
import type {PageItem} from '../../../app/page/region/PageItem';
import type {PageItemType} from '../../../app/page/region/PageItemType';
import {$page, $pageVersion} from './pageEditor.store';

//
// * State
//

const $inspectedPath = atom<string | null>(null);

//
// * Computed
//

export const $isInspecting = computed($inspectedPath, (path): boolean => path != null);

// Resolves the string path to the actual PageItem from the page model.
// Depends on $pageVersion to re-evaluate when mutable Page objects change.
export const $inspectedItem = computed(
    [$inspectedPath, $page, $pageVersion],
    (path, page): PageItem | null => {
        if (path == null || page == null) return null;
        return page.getComponentByPath(ComponentPath.fromString(path));
    },
);

export const $inspectedItemType = computed(
    $inspectedItem,
    (item): PageItemType | null => item?.getType() ?? null,
);

//
// * Actions
//

export function inspectItem(path: ComponentPath | null): void {
    $inspectedPath.set(path ? path.toString() : null);
}

export function clearInspection(): void {
    $inspectedPath.set(null);
}
