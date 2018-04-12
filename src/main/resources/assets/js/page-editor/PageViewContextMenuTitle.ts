import './../api.ts';
import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {PageItemType} from './PageItemType';

export class PageViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(content: api.content.Content) {
        let name = !!content.getDisplayName() ? content.getDisplayName() : api.content.ContentUnnamed.prettifyUnnamed();
        super(name, PageItemType.get().getConfig().getIconCls());
    }

}
