import { type ResultMetadataJson } from '../../v6/shared/api/ResultMetadataJson';

export interface ListContentResult<T> {
    contents: T[];

    metadata: ResultMetadataJson;
}
