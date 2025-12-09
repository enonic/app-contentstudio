import {computed} from 'nanostores';
import {$contentTreeItems} from '../contentTreeData.store';
import {$contentTreeActiveItem, $contentTreeSelection} from '../contentTreeSelectionStore';

export const $contextContent = computed(
    [$contentTreeActiveItem, $contentTreeSelection, $contentTreeItems],
    (activeContentId, selectedContentIds, contents) => {
        if (selectedContentIds.size >= 1) {
            const lastSelectedContentId = Array.from(selectedContentIds).pop();

            return contents.nodes[lastSelectedContentId]?.item;
        }

        if (activeContentId) {
            return contents.nodes[activeContentId]?.item;
        }

        return null;
    }
);
