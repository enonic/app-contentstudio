import {batched} from 'nanostores';
import {$contentTreeItems} from './contentTreeData.store';
import {$contentTreeSelection, $contentTreeSelectionMode, isItemSelected} from './contentTreeSelectionStore';

export const $numberOfSelected = batched([$contentTreeSelection, $contentTreeSelectionMode], (selection, mode) => {
    if (mode === 'single') {
        return 0;
    }

    return selection.size;
});

export const $isAllSelected = batched([$contentTreeItems, $contentTreeSelectionMode, $contentTreeSelection], (items, mode) => {
    if (mode === 'single') {
        return false;
    }

    return Object.keys(items).every((itemId) => isItemSelected(itemId));
});

export const $isNoneSelected = batched([$contentTreeSelection, $contentTreeSelectionMode, $contentTreeSelection], (selection, mode) => {
    return mode === 'single' || selection.size === 0;
});
