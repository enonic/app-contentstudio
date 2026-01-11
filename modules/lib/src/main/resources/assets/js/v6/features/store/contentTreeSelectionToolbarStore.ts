import {batched} from 'nanostores';
import {$treeState} from './tree-list.store';
import {$contentTreeSelection, $contentTreeSelectionMode, isItemSelected} from './contentTreeSelectionStore';

export const $numberOfSelected = batched([$contentTreeSelection, $contentTreeSelectionMode], (selection, mode) => {
    if (mode === 'single') {
        return 0;
    }

    return selection.size;
});

export const $isAllSelected = batched([$treeState, $contentTreeSelectionMode, $contentTreeSelection], (treeState, mode) => {
    if (mode === 'single') {
        return false;
    }

    return Array.from(treeState.nodes.keys()).every((itemId) => isItemSelected(itemId));
});

export const $isNoneSelected = batched([$contentTreeSelection, $contentTreeSelectionMode, $contentTreeSelection], (selection, mode) => {
    return mode === 'single' || selection.size === 0;
});
