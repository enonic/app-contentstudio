import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';

export class DeletedContentItem {
    readonly id: ContentId;

    readonly path: ContentPath;

    constructor(id: ContentId, path: ContentPath) {
        this.id = id;
        this.path = path;
    }
}
