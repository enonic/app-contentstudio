import {atom, computed} from 'nanostores';
import {SettingsViewItem} from '../../../app/settings/view/SettingsViewItem';
import {$settingsTreeState, getSettingsItem} from './settings-tree.store';

export const $selection = atom<ReadonlySet<string>>(new Set());
export const $activeId = atom<string | null>(null);

export const $currentIds = computed([$selection, $activeId], (selection, activeId) => {
    if (selection.size > 0) {
        return [...selection];
    }
    return activeId ? [activeId] : [];
});

export const $currentItems = computed($currentIds, (ids) => {
    return ids.map((id) => getSettingsItem(id)).filter((item): item is SettingsViewItem => !!item);
});

export const $selectedItems = computed($selection, (selection) => {
    return Array.from(selection)
        .map((id) => getSettingsItem(id))
        .filter((item): item is SettingsViewItem => !!item);
});

export const $selectionCount = computed($selection, (selection) => selection.size);

export const $isAllSelected = computed([$settingsTreeState, $selection], (state, selection) => {
    if (state.nodes.size === 0 || selection.size === 0) {
        return false;
    }
    return Array.from(state.nodes.keys()).every((id) => selection.has(id));
});

export const $isNoneSelected = computed($selection, (selection) => selection.size === 0);

export function setActive(id: string | null): void {
    $activeId.set(id);
}

export function toggleSelection(id: string): void {
    const current = $selection.get();
    const next = new Set(current);
    if (next.has(id)) {
        next.delete(id);
    } else {
        next.add(id);
    }
    $selection.set(next);
}

export function setSelection(ids: string[] | ReadonlySet<string>): void {
    const next = ids instanceof Set ? ids : new Set(ids);
    $selection.set(next);
}

export function clearSelection(): void {
    $selection.set(new Set());
}

export function selectAll(): void {
    const allIds = Array.from($settingsTreeState.get().nodes.keys());
    $selection.set(new Set(allIds));
}

export function getCurrentItems(): readonly SettingsViewItem[] {
    return $currentItems.get();
}

export function hasCurrentItems(): boolean {
    return $currentIds.get().length > 0;
}

$settingsTreeState.subscribe((state) => {
    const currentSelection = $selection.get();
    if (currentSelection.size === 0 && $activeId.get() === null) {
        return;
    }

    const validIds = new Set(state.nodes.keys());
    let changed = false;
    const nextSelection = new Set<string>();

    currentSelection.forEach((id) => {
        if (validIds.has(id)) {
            nextSelection.add(id);
        } else {
            changed = true;
        }
    });

    if (changed) {
        $selection.set(nextSelection);
    }

    const activeId = $activeId.get();
    if (activeId && !validIds.has(activeId)) {
        $activeId.set(null);
    }
});
