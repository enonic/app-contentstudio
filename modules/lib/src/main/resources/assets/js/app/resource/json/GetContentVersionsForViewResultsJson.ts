import {ContentVersionViewJson} from './ContentVersionViewJson';
import {ActiveContentVersionJson} from './ActiveContentVersionJson';

export interface GetContentVersionsForViewResultsJson {
    totalHits: number;

    contentVersions: ContentVersionViewJson[];

    cursor: string;
}
