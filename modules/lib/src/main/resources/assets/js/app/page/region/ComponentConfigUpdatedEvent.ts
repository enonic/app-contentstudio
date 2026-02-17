import {type ComponentPath} from './ComponentPath';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {type PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';

export class ComponentConfigUpdatedEvent
    extends ComponentUpdatedEvent {

    private readonly config: PropertyTree;

    constructor(componentPath: ComponentPath, config: PropertyTree) {
        super(componentPath);

        this.config = config.copy();
    }

    getConfig(): PropertyTree {
        return this.config;
    }
}
