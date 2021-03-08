import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {RegionItemType} from './RegionItemType';
import {Region} from '../app/page/region/Region';

export class RegionViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(region: Region) {
        super(region.getName(), RegionItemType.get().getConfig().getIconCls());
    }

}
