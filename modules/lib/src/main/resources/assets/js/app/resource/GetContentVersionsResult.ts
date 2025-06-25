import {ContentVersion} from '../ContentVersion';
import {ContentVersionViewJson} from './json/ContentVersionViewJson';
import {GetContentVersionsResultsJson} from './json/GetContentVersionsResultsJson';

export class GetContentVersionsResult {

    private readonly contentVersions: ContentVersion[];

    private readonly cursor?: string;

    private readonly onlineVersionId?: string;

    private constructor(contentVersions: ContentVersion[], cursor?: string, onlineVersionId?: string) {
        this.contentVersions = contentVersions;
        this.cursor = cursor;
        this.onlineVersionId = onlineVersionId;
    }

    getContentVersions(): ContentVersion[] {
        return this.contentVersions.slice();
    }

    getCursor(): string | undefined {
        return this.cursor;
    }

    getOnlineVersionId(): string | undefined {
        return this.onlineVersionId;
    }

    static fromJson(json: GetContentVersionsResultsJson): GetContentVersionsResult {
        const contentVersions: ContentVersion[] = json.contentVersions.map(
            (contentVersionViewJson: ContentVersionViewJson) => {
                return ContentVersion.fromJson(contentVersionViewJson, contentVersionViewJson.workspaces);
            });

        return new GetContentVersionsResult(contentVersions, json.cursor ?? undefined, json.onlineVersionId ?? undefined);
    }
}
