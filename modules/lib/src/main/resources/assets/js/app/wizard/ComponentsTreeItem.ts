import {type PageItemType} from '../page/region/PageItemType';
import {type IDentifiable} from '@enonic/lib-admin-ui/IDentifiable';
import {type TreeComponent} from './TreeComponent';
import {ComponentIdProducer} from '../page/region/ComponentIdProducer';

// Wrapper around TreeComponent to bring id
export class ComponentsTreeItem
    implements IDentifiable {

    private static ID_PRODUCER: ComponentIdProducer = new ComponentIdProducer();

    private readonly component: TreeComponent;

    private readonly id: number;

    // use id if updating existing node
    constructor(component: TreeComponent, id?: number) {
        this.component = component;
        this.id = id ?? ComponentsTreeItem.ID_PRODUCER.next();
    }

    getType(): PageItemType {
        return this.component.getType();
    }

    getComponent(): TreeComponent {
        return this.component;
    }

    getId(): string {
        return this.id.toString();
    }

    isInvalid(): boolean {
        return this.component?.isInvalid();
    }
}
