import ContentMetadata = api.content.ContentMetadata;

export interface ListContentResult<T> {

    contents: T[];

    metadata: ContentMetadata;
}
