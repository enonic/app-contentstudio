import {computed} from 'nanostores';
import {$contentTreeActiveItem, $contentTreeSelection} from '../contentTreeSelectionStore';
import {$flatContentTreeItems} from '../contentTreeData.store';

export const $contextContent = computed(
    [$contentTreeActiveItem, $contentTreeSelection, $flatContentTreeItems],
    (activeContentId, selectedContentIds, contents) => {
        if (selectedContentIds.size >= 1) {
            const lastSelectedContentId = Array.from(selectedContentIds).pop();

            return contents.find((content) => content.id === lastSelectedContentId)?.item;
        }

        if (activeContentId) {
            return contents.find((content) => content.id === activeContentId)?.item;
        }

        return null;
    }
);
