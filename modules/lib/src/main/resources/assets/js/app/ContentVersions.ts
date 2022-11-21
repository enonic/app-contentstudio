import {ContentVersion} from './ContentVersion';
import {ContentVersionViewJson} from './resource/json/ContentVersionViewJson';
import {GetContentVersionsForViewResultsJson} from './resource/json/GetContentVersionsForViewResultsJson';

export class ContentVersions {

    private readonly contentVersions: ContentVersion[];

    private readonly activeVersionId?: string;

    private readonly publishedVersionId?: string;

    constructor(contentVersions: ContentVersion[], activeVersionId?: string) {
        this.contentVersions = contentVersions;
        this.activeVersionId = activeVersionId;
        this.publishedVersionId = this.findPublishedVersionId(contentVersions);
    }

    get(): ContentVersion[] {
        return this.contentVersions;
    }

    getActiveVersionId(): string {
        return this.activeVersionId;
    }

    getPublishedVersionId(): string {
        return this.publishedVersionId;
    }

    getActiveVersion(): ContentVersion {
        return this.getVersionById(this.getActiveVersionId());
    }

    getPublishedVersion(): ContentVersion {
        return this.getVersionById(this.getPublishedVersionId());
    }

    getVersionById(value: string): ContentVersion {
        return this.contentVersions.find((version: ContentVersion) => version.getId() === value);
    }

    private findPublishedVersionId(versions: ContentVersion[]): string | undefined {
        return versions.reduce((prevPublished, contentVersion) => {
            const publishInfo = contentVersion.getPublishInfo();
            const prevPublishInfo = prevPublished?.getPublishInfo();
            if (!prevPublishInfo && publishInfo?.isPublished()
                || publishInfo?.getTimestamp()?.getTime() > prevPublishInfo?.getTimestamp()?.getTime()) {
                return contentVersion;
            }
            return prevPublished;
        })?.getId();
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
