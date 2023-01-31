import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {ComponentItemType} from './ComponentItemType';
import {Component} from '../app/page/region/Component';
import {ComponentPropertyChangedEvent} from '../app/page/region/ComponentPropertyChangedEvent';

export class ComponentViewContextMenuTitle<COMPONENT extends Component>
    extends ItemViewContextMenuTitle {

    constructor(component: COMPONENT, type: ComponentItemType) {
        super(component.getName()?.toString() || '', type.getConfig().getIconCls());

        this.initListeners(component);
    }

    private initListeners(component: COMPONENT): void {
        const handler = (event: ComponentPropertyChangedEvent) => {
            if (event.getPropertyName() === Component.PROPERTY_NAME) {
                this.setMainName(component.getName()?.toString() || '');
            }
        };

        component.onPropertyChanged(handler);
        this.onRemoved(() => component.unPropertyChanged(handler));
    }

}
