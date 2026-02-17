import {type ContentIdBaseItemJson} from './ContentIdBaseItemJson';

export interface HasUnpublishedChildrenListJson {
    contents: HasUnpublishedChildrenJson[];
}

export interface HasUnpublishedChildrenJson {
    id: ContentIdBaseItemJson;
    hasChildren: boolean;
}
