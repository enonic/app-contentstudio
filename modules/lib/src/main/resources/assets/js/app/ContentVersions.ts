import {ContentVersion} from './ContentVersion';
import {ContentVersionViewJson} from './resource/json/ContentVersionViewJson';
import {GetContentVersionsForViewResultsJson} from './resource/json/GetContentVersionsForViewResultsJson';

export class ContentVersions {

    private readonly contentVersions: ContentVersion[];

    private readonly activeVersionId?: string;

    constructor(contentVersions: ContentVersion[], activeVersionId?: string) {
        this.contentVersions = contentVersions;
        this.activeVersionId = activeVersionId;
    }

    get(): ContentVersion[] {
        return this.contentVersions;
    }

    getActiveVersionId(): string {
        return this.activeVersionId;
    }

    getVersionById(value: string): ContentVersion {
        return this.contentVersions.find((version: ContentVersion) => version.getId() === value);
    }

    static fromJson(contentVersionForViewJson: GetContentVersionsForViewResultsJson): ContentVersions {
        const contentVersions: ContentVersion[] = contentVersionForViewJson.contentVersions.map(
            (contentVersionViewJson: ContentVersionViewJson) => {
                return ContentVersion.fromJson(contentVersionViewJson, contentVersionViewJson.workspaces);
            });

        const activeVersionId: string = contentVersionForViewJson.activeVersion?.contentVersion?.id;

        return new ContentVersions(contentVersions, activeVersionId);
    }
}
