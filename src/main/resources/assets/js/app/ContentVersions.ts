import {ContentVersion} from './ContentVersion';
import {ContentVersionViewJson} from './resource/json/ContentVersionViewJson';
import {GetContentVersionsForViewResultsJson} from './resource/json/GetContentVersionsForViewResultsJson';

export class ContentVersions {

    readonly contentVersions: ContentVersion[];

    constructor(contentVersions: ContentVersion[]) {
        this.contentVersions = contentVersions;
    }

    getContentVersions(): ContentVersion[] {
        return this.contentVersions;
    }

    getActiveVersion(): ContentVersion {
        return this.contentVersions.find((contentVersion: ContentVersion) => contentVersion.isActive());
    }

    static fromJson(contentVersionForViewJson: GetContentVersionsForViewResultsJson): ContentVersions {

        let contentVersions: ContentVersion[] = [];
        contentVersionForViewJson.contentVersions.forEach((contentVersionViewJson: ContentVersionViewJson) => {
            contentVersions.push(ContentVersion.fromJson(contentVersionViewJson, contentVersionViewJson.workspaces));
        });

        if (contentVersionForViewJson.activeVersion) {
            const activeVersion = ContentVersion.fromJson(contentVersionForViewJson.activeVersion.contentVersion,
                [contentVersionForViewJson.activeVersion.branch]);

            contentVersions.find((contentVersion: ContentVersion) => contentVersion.getId() === activeVersion.getId()).setActive(true);
        }

        return new ContentVersions(contentVersions);
    }
}
