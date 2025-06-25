import {batched} from 'nanostores';
import {$flatContentTreeItems} from './contentTreeData.store';
import {$contentTreeSelection, $contentTreeSelectionMode, isItemSelected} from './contentTreeSelectionStore';

export const $numberOfSelected = batched([$contentTreeSelection, $contentTreeSelectionMode], (selection, mode) => {
    if (mode === 'single') {
        return 0;
    }

    return selection.size;
});

export const $isAllSelected = batched([$flatContentTreeItems, $contentTreeSelectionMode, $contentTreeSelection], (items, mode) => {
    if (mode === 'single') {
        return false;
    }

    return items.every((item) => isItemSelected(item.id));
});

export const $isNoneSelected = batched([$contentTreeSelection, $contentTreeSelectionMode, $contentTreeSelection], (selection, mode) => {
    return mode === 'single' || selection.size === 0;
});
