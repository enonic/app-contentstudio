import {ContentVersionJson} from './ContentVersionJson';

export interface GetContentVersionsResultsJson {

    from: number;

    size: number;

    hits: number;

    totalHits: number;

    contentVersions: ContentVersionJson[];
}
