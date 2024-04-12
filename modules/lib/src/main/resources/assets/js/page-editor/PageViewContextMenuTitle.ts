import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {PageItemType} from './PageItemType';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';

export class PageViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(displayName: string) {
        super(displayName || NamePrettyfier.prettifyUnnamed(), PageItemType.get().getConfig().getIconCls());
    }

}
