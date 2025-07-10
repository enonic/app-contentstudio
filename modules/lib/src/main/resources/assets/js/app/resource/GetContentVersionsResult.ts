import {ContentVersion} from '../ContentVersion';
import {GetContentVersionsMetadata} from './GetContentVersionsMetadata';
import {ContentVersionViewJson} from './json/ContentVersionViewJson';
import {GetContentVersionsResultsJson} from './json/GetContentVersionsResultsJson';

export class GetContentVersionsResult {

    private readonly contentVersions: ContentVersion[];

    private readonly metadata: GetContentVersionsMetadata;

    private constructor(contentVersions: ContentVersion[], metadata: GetContentVersionsMetadata) {
        this.contentVersions = contentVersions;
        this.metadata = metadata;
    }

    getContentVersions(): ContentVersion[] {
        return this.contentVersions.slice();
    }

    getMetadata(): GetContentVersionsMetadata {
        return this.metadata;
    }

    static fromJson(json: GetContentVersionsResultsJson): GetContentVersionsResult {
        const contentVersions: ContentVersion[] = json.contentVersions.map(
            (contentVersionViewJson: ContentVersionViewJson) => {
                return ContentVersion.fromJson(contentVersionViewJson, contentVersionViewJson.workspaces);
            });

        return new GetContentVersionsResult(contentVersions,
            {from: json.from, size: json.size, hits: json.hits, totalHits: json.totalHits});
    }
}
