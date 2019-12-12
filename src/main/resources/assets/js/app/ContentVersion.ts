import {ContentVersionJson} from './resource/json/ContentVersionJson';
import {ContentVersionPublishInfo} from './ContentVersionPublishInfo';
import Workflow = api.content.Workflow;
import WorkflowState = api.content.WorkflowState;

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
}
