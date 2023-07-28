import {IDentifiable} from '@enonic/lib-admin-ui/IDentifiable';
import {ItemView} from './ItemView';
import {ComponentItemType, TreeComponent} from './TreeComponent';
import {ComponentIdProducer} from './ComponentIdProducer';
import {ComponentPath} from '../app/page/region/ComponentPath';

// Wrapper around TreeComponent to bring id
export class ComponentsTreeItem
    implements IDentifiable {

    private static ID_PRODUCER: ComponentIdProducer = new ComponentIdProducer();

    private readonly component: TreeComponent;

    private readonly id: number;

    constructor(component: TreeComponent) {
        this.component = component;
        this.id = ComponentsTreeItem.ID_PRODUCER.next();
    }

    getItemView(): ItemView {
        return null;
    }

    getType(): ComponentItemType {
        return this.component.getType();
    }

    getComponent(): TreeComponent {
        return this.component;
    }

    getId(): string {
        return this.id.toString();
    }

    getPath(): ComponentPath {
        return this.component.getPath();
    }
}