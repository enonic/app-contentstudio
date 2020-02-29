import {ContentVersionJson} from './resource/json/ContentVersionJson';
import {ContentVersionPublishInfo} from './ContentVersionPublishInfo';
import {Workflow} from 'lib-admin-ui/content/Workflow';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {Branch} from './versioning/Branch';

export class ContentVersion {

    private modifier: string;

    private modifierDisplayName: string;

    private displayName: string;

    private modified: Date;

    private comment: string;

    private id: string;

    private workspaces: string[];

    private publishInfo: ContentVersionPublishInfo;

    private workflowInfo: Workflow;

    constructor(builder: ContentVersionBuilder) {
        this.modifier = builder.modifier;
        this.displayName = builder.displayName;
        this.modified = builder.modified;
        this.modifierDisplayName = builder.modifierDisplayName;
        this.comment = builder.comment;
        this.id = builder.id;
        this.workspaces = builder.workspaces || [];
        this.publishInfo = builder.publishInfo;
        this.workflowInfo = builder.workflowInfo;
    }

    static fromJson(contentVersionJson: ContentVersionJson, workspaces?: string[]): ContentVersion {
        return new ContentVersionBuilder().fromJson(contentVersionJson, workspaces).build();
    }

    public isInMaster(): boolean {
        return this.getWorkspaces().some((workspace) => {
            return workspace === Branch.MASTER;
        });
    }

    getModifier(): string {
        return this.modifier;
    }

    getModifierDisplayName(): string {
        return this.modifierDisplayName;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getModified(): Date {
        return this.modified;
    }

    getComment(): string {
        return this.comment;
    }

    getId(): string {
        return this.id;
    }

    getWorkspaces(): string[] {
        return this.workspaces;
    }

    hasWorkspaces(): boolean {
        return this.workspaces && this.workspaces.length > 0;
    }

    hasBothWorkspaces(): boolean {
        return this.workspaces && this.workspaces.length > 1;
    }

    hasPublishInfo(): boolean {
        return !!this.publishInfo;
    }

    getPublishInfo(): ContentVersionPublishInfo {
        return this.publishInfo;
    }

    getWorkflowInfo(): Workflow {
        return this.workflowInfo;
    }

    isInReadyState(): boolean {
        return this.workflowInfo && this.workflowInfo.getState() === WorkflowState.READY;
    }

    newBuilder(): ContentVersionBuilder {
        return new ContentVersionBuilder(this);
    }
}

export class ContentVersionBuilder {
    modifier: string;

    modifierDisplayName: string;

    displayName: string;

    modified: Date;

    comment: string;

    id: string;

    workspaces: string[];

    publishInfo: ContentVersionPublishInfo;

    workflowInfo: Workflow;

    constructor(source?: ContentVersion) {
        if (source) {
            this.modifier = source.getModifier();
            this.modifierDisplayName = source.getModifierDisplayName();
            this.displayName = source.getDisplayName();
            this.modified = !!source.getModified() ? new Date(source.getModified().getTime()) : null;
            this.comment = source.getComment();
            this.id = source.getId();
            this.workspaces = source.getWorkspaces().slice();
            this.publishInfo = source.getPublishInfo();
            this.workflowInfo = source.getWorkflowInfo();
        }
    }

    fromJson(contentVersionJson: ContentVersionJson, workspaces?: string[]): ContentVersionBuilder {
        this.modifier = contentVersionJson.modifier;
        this.displayName = contentVersionJson.displayName;
        this.modified = !!contentVersionJson.modified ? new Date(contentVersionJson.modified) : null;
        this.modifierDisplayName = contentVersionJson.modifierDisplayName;
        this.comment = contentVersionJson.comment;
        this.id = contentVersionJson.id;
        this.workspaces = workspaces || [];
        this.publishInfo = ContentVersionPublishInfo.fromJson(contentVersionJson.publishInfo);
        this.workflowInfo = Workflow.fromJson(contentVersionJson.workflow);

        return this;
    }

    build(): ContentVersion {
        return new ContentVersion(this);
    }
}
