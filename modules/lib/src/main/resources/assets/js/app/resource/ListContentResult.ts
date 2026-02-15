import {type ResultMetadataJson} from './json/ResultMetadataJson';

export interface ListContentResult<T> {

    contents: T[];

    metadata: ResultMetadataJson;
}
