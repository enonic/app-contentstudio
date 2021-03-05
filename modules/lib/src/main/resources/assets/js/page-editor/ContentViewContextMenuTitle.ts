import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {ContentView} from './ContentView';
import {ContentItemType} from './ContentItemType';

export class ContentViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(contentView: ContentView) {
        super(contentView.getName(), ContentItemType.get().getConfig().getIconCls());
    }

}
