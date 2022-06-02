import {OptionDataHelper} from '@enonic/lib-admin-ui/ui/selector/OptionDataHelper';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';

export class ContentSummaryOptionDataHelper
    implements OptionDataHelper<ContentTreeSelectorItem> {

    hasChildren(data: ContentTreeSelectorItem): boolean {
        return data ? data.hasChildren() : false;
    }

    getDataId(data: ContentTreeSelectorItem): string {
        return data ? data.getId() : '';
    }

    isDescendingPath(childOption: ContentTreeSelectorItem, parentOption: ContentTreeSelectorItem) {
        return childOption.getPath().isDescendantOf(parentOption.getPath());
    }

    isSelectable(data: ContentTreeSelectorItem): boolean {
        return data.isSelectable();
    }

    isExpandable(data: ContentTreeSelectorItem): boolean {
        return data.isExpandable();
    }
}
