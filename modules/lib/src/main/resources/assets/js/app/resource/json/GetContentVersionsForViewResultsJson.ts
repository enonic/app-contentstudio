import {type ContentVersionViewJson} from './ContentVersionViewJson';

export interface GetContentVersionsForViewResultsJson {
    totalHits: number;

    contentVersions: ContentVersionViewJson[];

    cursor: string;
}
