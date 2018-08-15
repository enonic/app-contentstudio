import {ContentVersion} from './ContentVersion';
import {ContentVersionViewJson} from './resource/json/ContentVersionViewJson';
import {GetContentVersionsForViewResultsJson} from './resource/json/GetContentVersionsForViewResultsJson';

export class ContentVersions {

    private contentVersions: ContentVersion[];

    private activeVersion: ContentVersion;

    getContentVersions(): ContentVersion[] {
        return this.contentVersions;
    }

    getActiveVersion(): ContentVersion {
        return this.activeVersion;
    }

    constructor(contentVersions: ContentVersion[], activeVersion: ContentVersion) {
        this.contentVersions = contentVersions;
        this.activeVersion = activeVersion;
    }

    static fromJson(contentVersionForViewJson: GetContentVersionsForViewResultsJson): ContentVersions {

        let contentVersions: ContentVersion[] = [];
        contentVersionForViewJson.contentVersions.forEach((contentVersionViewJson: ContentVersionViewJson) => {
            contentVersions.push(ContentVersion.fromJson(contentVersionViewJson, contentVersionViewJson.workspaces));
        });

        let activeVersion;

        if (contentVersionForViewJson.activeVersion) {
            activeVersion = ContentVersion.fromJson(contentVersionForViewJson.activeVersion.contentVersion,
                [contentVersionForViewJson.activeVersion.branch]);
        }

        return new ContentVersions(contentVersions, activeVersion);
    }
}
