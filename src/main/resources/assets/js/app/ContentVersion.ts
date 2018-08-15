import {ContentVersionJson} from './resource/json/ContentVersionJson';

export class ContentVersion {

    modifier: string;

    modifierDisplayName: string;

    displayName: string;

    modified: Date;

    comment: string;

    id: string;

    workspaces: string[];

    static fromJson(contentVersionJson: ContentVersionJson, workspaces?: string[]): ContentVersion {

        let contentVersion: ContentVersion = new ContentVersion();
        contentVersion.modifier = contentVersionJson.modifier;
        contentVersion.displayName = contentVersionJson.displayName;
        contentVersion.modified = new Date(contentVersionJson.modified);
        contentVersion.modifierDisplayName = contentVersionJson.modifierDisplayName;
        contentVersion.comment = contentVersionJson.comment;
        contentVersion.id = contentVersionJson.id;
        contentVersion.workspaces = workspaces || [];

        return contentVersion;
    }
}
