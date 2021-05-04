import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentId} from '../content/ContentId';

export class DeletedContentItem {
    readonly id: ContentId;

    readonly path: ContentPath;

    constructor(id: ContentId, path: ContentPath) {
        this.id = id;
        this.path = path;
    }
}
