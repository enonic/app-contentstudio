import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {ComponentItemType} from './ComponentItemType';
import {Component} from '../app/page/region/Component';
import {ComponentPropertyChangedEvent} from '../app/page/region/ComponentPropertyChangedEvent';

export class ComponentViewContextMenuTitle<COMPONENT extends Component>
    extends ItemViewContextMenuTitle {

    constructor(name: string, type: ComponentItemType) {
        super(name || '', type.getConfig().getIconCls());
    }

}
