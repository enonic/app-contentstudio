import {atom, computed} from 'nanostores';
import {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {$flatContentTreeItems} from './contentTreeData.store';

export const $contentTreeSelection = atom<ReadonlySet<string>>(new Set());

export const $contentTreeActiveItem = atom<string | null>(null);

export const $contentTreeSelectionMode = atom<'multiple' | 'single'>('single');

export function setActiveItem(id: string | null): void {
    $contentTreeActiveItem.set(id);
}

export const setTreeSelectionMode = (mode: 'multiple' | 'single'): void => {
    $contentTreeSelectionMode.set(mode);
}

export function getSelectedItems(): ContentSummaryAndCompareStatus[] {
    return $flatContentTreeItems.get().filter((data) => $contentTreeSelection.get().has(data.id)).map((data) => data.item);
}

export function addSelectedItem(id: string): void {
    const newSelection = new Set($contentTreeSelection.get());
    newSelection.add(id);
    $contentTreeSelection.set(newSelection);
}

export function removeSelectedItem(id: string): void {
    const newSelection = new Set($contentTreeSelection.get());
    newSelection.delete(id);
    $contentTreeSelection.set(newSelection);
}

export function hasSelectedItems(): boolean {
    return $contentTreeSelection.get().size > 0;
}

export const setSingleSelectionMode = (): void => {
    setTreeSelectionMode('single');
}

export const setMultipleSelectionMode = (): void => {
    setTreeSelectionMode('multiple');
}

export const isSingleSelectionMode = (): boolean => {
    return $contentTreeSelectionMode.get() === 'single';
}

export const isMultipleSelectionMode = (): boolean => {
    return $contentTreeSelectionMode.get() === 'multiple';
}

export function selectAllItems(): void {
    const allItemsIds = $flatContentTreeItems.get().map(item => item.id);
    $contentTreeSelection.set(new Set(allItemsIds));
}

export function isItemSelected(id: string): boolean {
    return $contentTreeSelection.get().has(id);
}

export function resetSelection(): void {
    $contentTreeSelection.set(new Set());
}

export function setSelection(ids: string[]): void {
    $contentTreeSelection.set(new Set(ids));
}
