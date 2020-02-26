import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {PageItemType} from './PageItemType';
import {Content} from '../app/content/Content';
import {ContentUnnamed} from 'lib-admin-ui/content/ContentUnnamed';

export class PageViewContextMenuTitle
    extends ItemViewContextMenuTitle {

    constructor(content: Content) {
        let name = !!content.getDisplayName() ? content.getDisplayName() : ContentUnnamed.prettifyUnnamed();
        super(name, PageItemType.get().getConfig().getIconCls());
    }

}
