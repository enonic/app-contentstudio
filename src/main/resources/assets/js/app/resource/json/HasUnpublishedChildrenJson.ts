import {ContentIdBaseItemJson} from './ResolvePublishContentResultJson';

export interface HasUnpublishedChildrenListJson {
    contents: HasUnpublishedChildrenJson[];
}

export interface HasUnpublishedChildrenJson {
    id: ContentIdBaseItemJson;
    hasChildren: boolean;
}
