import {ComponentPath} from './ComponentPath';
import {ComponentUpdatedEvent} from './ComponentUpdatedEvent';
import {ContentId} from '../../content/ContentId';

export class ComponentImageUpdatedEvent
    extends ComponentUpdatedEvent {

    private readonly imageId: ContentId;

    constructor(componentPath: ComponentPath, value: ContentId) {
        super(componentPath);

        this.imageId = value;
    }

    getImageId(): ContentId {
        return this.imageId;
    }
}
