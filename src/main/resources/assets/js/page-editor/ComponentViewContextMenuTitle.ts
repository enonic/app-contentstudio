import {ItemViewContextMenuTitle} from './ItemViewContextMenuTitle';
import {ComponentItemType} from './ComponentItemType';
import {Component} from '../app/page/region/Component';
import {ComponentPropertyChangedEvent} from '../app/page/region/ComponentPropertyChangedEvent';

export class ComponentViewContextMenuTitle<COMPONENT extends Component>
    extends ItemViewContextMenuTitle {

    constructor(component: COMPONENT, type: ComponentItemType) {
        const createMainName = (mainComponent: COMPONENT): string => {
            return mainComponent.getName() ? mainComponent.getName().toString() : '';
        };
        const handler = (event: ComponentPropertyChangedEvent) => {
            if (event.getPropertyName() === Component.PROPERTY_NAME) {
                this.setMainName(createMainName(component));
            }
        };
        super(createMainName(component), type.getConfig().getIconCls());

        component.onPropertyChanged(handler);
        this.onRemoved(() => component.unPropertyChanged(handler));
    }

}
