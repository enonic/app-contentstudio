import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {PageItemType} from './PageItemType';
import {Content} from '../app/content/Content';

export class PageViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(content: Content) {
        let name = !!content.getDisplayName() ? content.getDisplayName() : api.content.ContentUnnamed.prettifyUnnamed();
        super(name, PageItemType.get().getConfig().getIconCls());
    }

}
