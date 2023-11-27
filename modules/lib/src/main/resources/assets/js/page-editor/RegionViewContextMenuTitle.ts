import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {RegionItemType} from './RegionItemType';

export class RegionViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(name: string) {
        super(name, RegionItemType.get().getConfig().getIconCls());
    }

}
