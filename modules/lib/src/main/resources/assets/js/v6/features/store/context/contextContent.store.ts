import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {$currentItem} from '../contentTreeSelection.store';

// Re-export for backwards compatibility
export {$currentItem as $contextContent} from '../contentTreeSelection.store';

export const openContextContentForEdit = (): void => {
    const content = $currentItem.get();
    if (!content) {
        return;
    }

    new EditContentEvent([content]).fire();
};
