import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {PageItemType} from './PageItemType';
import {Content} from '../app/content/Content';
import {NamePrettyfier} from 'lib-admin-ui/NamePrettyfier';

export class PageViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(content: Content) {
        let name = !!content.getDisplayName() ? content.getDisplayName() : NamePrettyfier.prettifyUnnamed();
        super(name, PageItemType.get().getConfig().getIconCls());
    }

}
