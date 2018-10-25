import {ComponentChangedEvent} from './ComponentChangedEvent';
import {ComponentPath} from './ComponentPath';

export class ComponentResetEvent
    extends ComponentChangedEvent {

    constructor(componentPath: ComponentPath) {
        super(componentPath);
    }
}
