import {ContentVersion} from '../ContentVersion';
import {type GetContentVersionsMetadata} from './GetContentVersionsMetadata';
import {type ContentVersionViewJson} from './json/ContentVersionViewJson';
import {type GetContentVersionsResultsJson} from './json/GetContentVersionsResultsJson';

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

        return new GetContentVersionsResult(contentVersions, {cursor: json.cursor});
    }
}
