import {ActiveContentVersionJson} from './ActiveContentVersionJson';

export interface GetActiveContentVersionsResultsJson {

    from: number;

    size: number;

    hits: number;

    totalHits: number;

    activeContentVersions: ActiveContentVersionJson[];
}
