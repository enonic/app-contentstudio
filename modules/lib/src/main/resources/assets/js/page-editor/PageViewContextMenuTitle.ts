import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {PageItemType} from './PageItemType';
import {Content} from '../app/content/Content';
import {NamePrettyfier} from '@enonic/lib-admin-ui/NamePrettyfier';

export class PageViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(displayName: string) {
        super(displayName || NamePrettyfier.prettifyUnnamed(), PageItemType.get().getConfig().getIconCls());
    }

}
