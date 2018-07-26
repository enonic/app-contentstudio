import ContentIdBaseItemJson = api.content.json.ContentIdBaseItemJson;

export interface HasUnpublishedChildrenListJson {
    contents: HasUnpublishedChildrenJson[];
}

export interface HasUnpublishedChildrenJson {
    id: ContentIdBaseItemJson;
    hasChildren: boolean;
}
