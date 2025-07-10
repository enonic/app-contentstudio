import {ContentVersionViewJson} from './ContentVersionViewJson';
import {ActiveContentVersionJson} from './ActiveContentVersionJson';

export interface GetContentVersionsForViewResultsJson {

    from: number;

    size: number;

    hits: number;

    totalHits: number;

    contentVersions: ContentVersionViewJson[];
}
