import {type ContentVersionViewJson} from './ContentVersionViewJson';

export interface GetContentVersionsForViewResultsJson {
    contentVersions: ContentVersionViewJson[];
    cursor?: string;
}
