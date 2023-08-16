import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {RegionItemType} from './RegionItemType';
import {Region} from '../app/page/region/Region';

export class RegionViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(name: string) {
        super(name, RegionItemType.get().getConfig().getIconCls());
    }

}
