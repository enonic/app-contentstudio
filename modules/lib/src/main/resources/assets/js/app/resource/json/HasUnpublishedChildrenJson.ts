import { type ContentIdBaseItemJson } from '../../../v6/entities/content/api/ContentIdBaseItemJson';

export interface HasUnpublishedChildrenListJson {
    contents: HasUnpublishedChildrenJson[];
}

export interface HasUnpublishedChildrenJson {
    id: ContentIdBaseItemJson;
    hasChildren: boolean;
}
