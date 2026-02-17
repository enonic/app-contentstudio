import {type ContentVersionJson} from './ContentVersionJson';

export interface GetContentVersionsResultsJson {
    contentVersions: ContentVersionJson[];
    cursor: string;
}
