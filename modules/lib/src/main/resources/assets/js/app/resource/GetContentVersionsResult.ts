import {ContentVersions} from '../ContentVersions';
import {GetContentVersionsMetadata} from './GetContentVersionsMetadata';
import {GetContentVersionsForViewResultsJson} from './json/GetContentVersionsForViewResultsJson';

export class GetContentVersionsResult {

    private readonly contentVersions: ContentVersions;

    private readonly metadata: GetContentVersionsMetadata;

    private constructor(contentVersions: ContentVersions, metadata: GetContentVersionsMetadata) {
        this.contentVersions = contentVersions;
        this.metadata = metadata;
    }

    getContentVersions(): ContentVersions {
        return this.contentVersions;
    }

    getMetadata(): GetContentVersionsMetadata {
        return this.metadata;
    }

    static fromJson(json: GetContentVersionsForViewResultsJson): GetContentVersionsResult {
        return new GetContentVersionsResult(ContentVersions.fromJson(json),
            {from: json.from, size: json.size, hits: json.hits, totalHits: json.totalHits});
    }
}
