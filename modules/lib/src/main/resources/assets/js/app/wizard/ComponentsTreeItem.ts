import {IDentifiable} from '@enonic/lib-admin-ui/IDentifiable';
import {ItemView} from '../../page-editor/ItemView';
import {TreeComponent} from './TreeComponent';
import {ComponentIdProducer} from '../../page-editor/ComponentIdProducer';
import {PageItemType} from '../page/region/PageItemType';

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
