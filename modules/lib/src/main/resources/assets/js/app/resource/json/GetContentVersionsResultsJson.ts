import {ContentVersionJson} from './ContentVersionJson';

export interface GetContentVersionsResultsJson {
    contentVersions: ContentVersionJson[];
    cursor: string;
}
