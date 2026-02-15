import {type ComponentPath} from './ComponentPath';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {type ContentId} from '../../content/ContentId';

export class ComponentFragmentUpdatedEvent
    extends ComponentUpdatedEvent {

    private readonly fragmentId: ContentId;

    constructor(componentPath: ComponentPath, value: ContentId) {
        super(componentPath);

        this.fragmentId = value;
    }

    getFragmentId(): ContentId {
        return this.fragmentId;
    }
}
