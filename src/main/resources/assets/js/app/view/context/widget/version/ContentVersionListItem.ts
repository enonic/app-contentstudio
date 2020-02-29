import {ContentVersion} from '../../../../ContentVersion';
import {Branch} from '../../../../versioning/Branch';

export class ContentVersionListItem {

    private contentVersion: ContentVersion;

    private workspace: Branch;

    private active: boolean;

    constructor(contentVersion: ContentVersion, workspace: Branch, active: boolean = false) {
        this.contentVersion = contentVersion;
        this.workspace = workspace;
        this.active = active;
    }

    getContentVersion(): ContentVersion {
        return this.contentVersion;
    }

    getId(): string {
        return `${this.contentVersion.getId()}:${this.workspace}`;
    }

    isActive(): boolean {
        return this.active;
    }

    isInMaster(): boolean {
        return this.workspace === Branch.MASTER;
    }

}
