import {ContentVersionJson} from './resource/json/ContentVersionJson';
import {ContentVersionPublishInfo} from './ContentVersionPublishInfo';
import {Workflow} from 'lib-admin-ui/content/Workflow';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {Branch} from './versioning/Branch';

export class ContentVersion {

    modifier: string;

    modifierDisplayName: string;

    displayName: string;

    modified: Date;

    comment: string;

    id: string;

    workspaces: string[];

    publishInfo: ContentVersionPublishInfo;

    workflowInfo: Workflow;

    static fromJson(contentVersionJson: ContentVersionJson, workspaces?: string[]): ContentVersion {

        let contentVersion: ContentVersion = new ContentVersion();
        contentVersion.modifier = contentVersionJson.modifier;
        contentVersion.displayName = contentVersionJson.displayName;
        contentVersion.modified = new Date(contentVersionJson.modified);
        contentVersion.modifierDisplayName = contentVersionJson.modifierDisplayName;
        contentVersion.comment = contentVersionJson.comment;
        contentVersion.id = contentVersionJson.id;
        contentVersion.workspaces = workspaces || [];

        contentVersion.publishInfo = ContentVersionPublishInfo.fromJson(contentVersionJson.publishInfo);
        contentVersion.workflowInfo = Workflow.fromJson(contentVersionJson.workflow);

        return contentVersion;
    }

    isStateReady(): boolean {
        return this.workflowInfo && WorkflowState.READY === this.workflowInfo.getState();
    }

    isInMaster(): boolean {
        return this.workspaces.some((workspace) => {
            return workspace === Branch.MASTER;
        });
    }

    hasWorkspaces(): boolean {
        return this.workspaces.length > 0;
    }

    hasPublishInfo(): boolean {
        return !!this.publishInfo;
    }

    hasPublishInfoMessage(): boolean {
        return this.publishInfo && !!this.publishInfo.message;
    }

    getPublishInfoMessage(): string {
        if (!this.publishInfo) {
            return '';
        }

        return this.publishInfo.message;
    }
}
