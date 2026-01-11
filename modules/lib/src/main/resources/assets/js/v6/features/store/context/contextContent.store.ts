import {computed} from 'nanostores';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {$contentCache} from '../content.store';
import {$contentTreeActiveItem, $contentTreeSelection} from '../contentTreeSelectionStore';

export const $contextContent = computed(
    [$contentTreeActiveItem, $contentTreeSelection, $contentCache],
    (activeContentId, selectedContentIds, cache) => {
        if (selectedContentIds.size >= 1) {
            const lastSelectedContentId = Array.from(selectedContentIds).pop();

            return cache[lastSelectedContentId];
        }

        if (activeContentId) {
            return cache[activeContentId];
        }

        return null;
    }
);

export const openContextContentForEdit = (): void => {
    if (!$contextContent.get()) {
        return;
    }

    new EditContentEvent([$contextContent.get()]).fire();
}
