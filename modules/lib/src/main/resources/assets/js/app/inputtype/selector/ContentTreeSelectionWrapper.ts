import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';

export class ContentTreeSelectionWrapper extends SelectableListBoxWrapper<ContentTreeSelectorItem> {

    toggleItemWrapperSelected(itemId: string, isSelected: boolean) {
        super.toggleItemWrapperSelected(itemId, isSelected);
    }

    protected handleUserToggleAction(item: ContentTreeSelectorItem) {
        if (item.isSelectable()) {
            super.handleUserToggleAction(item);
        }
    }
}
