import {ContentVersion} from './ContentVersion';
import {type ActiveContentVersionJson} from './resource/json/ActiveContentVersionJson';

export class ActiveContentVersion {

    private readonly branch: string;

    private readonly contentVersion: ContentVersion;

    constructor(contentVersion: ContentVersion, branch: string) {
        this.contentVersion = contentVersion;
        this.branch = branch;
    }

    getBranch(): string {
        return this.branch;
    }

    getContentVersion(): ContentVersion {
        return this.contentVersion;
    }

    static fromJson(json: ActiveContentVersionJson): ActiveContentVersion {
        return new ActiveContentVersion(ContentVersion.fromJson(json.contentVersion), json.branch);
    }
}
