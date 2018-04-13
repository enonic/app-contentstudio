import './../api.ts';
import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {RegionItemType} from './RegionItemType';

export class RegionViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(region: api.content.page.region.Region) {
        super(region.getName(), RegionItemType.get().getConfig().getIconCls());
    }

}
