import {ComponentRemovedEvent} from './ComponentRemovedEvent';
import {ComponentPath} from './ComponentPath';

export class ComponentRemovedOnMoveEvent extends ComponentRemovedEvent {

    constructor(path: ComponentPath) {
        super(path);
    }

}
