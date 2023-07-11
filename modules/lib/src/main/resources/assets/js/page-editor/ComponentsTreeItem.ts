import {IDentifiable} from '@enonic/lib-admin-ui/IDentifiable';
import {ItemView} from './ItemView';
import {TreeComponent} from './TreeComponent';
import {ComponentIdProducer} from './ComponentIdProducer';
import {ComponentPath} from '../app/page/region/ComponentPath';

export class ComponentsTreeItem
    implements IDentifiable {

    private static ID_PRODUCER: ComponentIdProducer = new ComponentIdProducer();

    private readonly component: TreeComponent;

    private readonly itemView?: ItemView;

    private readonly id: number;

    constructor(component: TreeComponent, itemView?: ItemView) {
        this.component = component;
        this.itemView = itemView;
        this.id = ComponentsTreeItem.ID_PRODUCER.next();
    }

    getItemView(): ItemView {
        return this.itemView;
    }

    getComponent(): TreeComponent {
        return this.component;
    }

    getId(): string {
        return this.id.toString();
    }

    getPath(): ComponentPath {
        return this.component.getItem().getPath();
    }
}
