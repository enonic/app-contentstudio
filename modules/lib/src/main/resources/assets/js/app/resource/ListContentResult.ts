import {ContentMetadata} from '../content/ContentMetadata';

export interface ListContentResult<T> {

    contents: T[];

    metadata: ContentMetadata;
}
