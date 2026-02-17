import {ChildOrder} from './resource/order/ChildOrder';
import {Workflow} from './content/Workflow';
import {WorkflowState} from './content/WorkflowState';
import {type ContentVersionJson} from './resource/json/ContentVersionJson';
import {ContentVersionPublishInfo} from './ContentVersionPublishInfo';
import {type Cloneable} from '@enonic/lib-admin-ui/Cloneable';

export class ContentVersion
    implements Cloneable {

    private readonly modifier: string;

    private readonly modifierDisplayName: string;

    private readonly displayName: string;

    private readonly modified: Date;

    private readonly childOrder: ChildOrder;

    private readonly timestamp: Date;

    private readonly comment: string;

    private readonly id: string;

    private readonly workspaces: string[];

    private readonly publishInfo: ContentVersionPublishInfo;

    private readonly workflowInfo: Workflow;

    private readonly permissionsChanged: boolean;

    private readonly path: string;

    constructor(builder: ContentVersionBuilder) {
        this.modifier = builder.modifier;
        this.displayName = builder.displayName;
        this.modified = builder.modified;
        this.childOrder = builder.childOrder;
        this.timestamp = builder.timestamp;
        this.modifierDisplayName = builder.modifierDisplayName;
        this.comment = builder.comment;
        this.id = builder.id;
        this.workspaces = builder.workspaces || [];
        this.publishInfo = builder.publishInfo;
        this.workflowInfo = builder.workflowInfo;
        this.permissionsChanged = !!builder.permissionsChanged;
        this.path = builder.path;

        if (this.publishInfo && this.publishInfo.getPublishedFrom()) {
            if (ContentVersion.equalDates(this.publishInfo.getPublishedFrom(), this.publishInfo.getTimestamp(), 500)) {
                // Version date/time and publishFrom on the server might be off by several milliseconds, in this case make them equal
                this.publishInfo.setPublishedFrom(this.publishInfo.getTimestamp());
            }
        }
    }

    static fromJson(contentVersionJson: ContentVersionJson, workspaces?: string[]): ContentVersion {
        return new ContentVersionBuilder().fromJson(contentVersionJson, workspaces).build();
    }

    static equalDates(date1: Date, date2: Date, delta: number): boolean {
        return Math.abs(Number(date1) - Number(date2)) < delta; // Allow 500 ms difference
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

    getDisplayDate(): Date {
        const publishInfo = this.getPublishInfo();
        if (this.isPublished()) {
            if (publishInfo.isScheduled()) {
                return publishInfo.getTimestamp();
            }
            if (publishInfo.getPublishedFrom() < publishInfo.getTimestamp()) {
                return publishInfo.getTimestamp();
            }
            return publishInfo.getPublishedFrom();
        }

        if (this.isUnpublished()) {
            return publishInfo.getTimestamp();
        }

        return this.getTimestamp();
    }

    getModified(): Date {
        return this.modified;
    }

    getChildOrder(): ChildOrder {
        return this.childOrder;
    }

    getTimestamp(): Date {
        return this.timestamp;
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

    isPublished(): boolean {
        return !!this.hasPublishInfo() && !!this.getPublishInfo().getPublishedFrom();
    }

    isUnpublished(): boolean {
        return !!this.hasPublishInfo() && !this.getPublishInfo().getPublishedFrom();
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

    isPermissionsChanged(): boolean {
        return this.permissionsChanged;
    }

    getPath(): string {
        return this.path;
    }

    newBuilder(): ContentVersionBuilder {
        return new ContentVersionBuilder(this);
    }

    clone(): ContentVersion {
        return this.newBuilder().build();
    }
}

export class ContentVersionBuilder {
    modifier: string;

    modifierDisplayName: string;

    displayName: string;

    modified: Date;

    childOrder: ChildOrder;

    timestamp: Date;

    comment: string;

    id: string;

    workspaces: string[];

    publishInfo: ContentVersionPublishInfo;

    workflowInfo: Workflow;

    path: string;

    permissionsChanged: boolean;

    constructor(source?: ContentVersion) {
        if (source) {
            this.modifier = source.getModifier();
            this.modifierDisplayName = source.getModifierDisplayName();
            this.displayName = source.getDisplayName();
            this.modified = source.getModified() ? new Date(source.getModified().getTime()) : null;
            this.childOrder = source.getChildOrder();
            this.timestamp = source.getTimestamp() ? new Date(source.getTimestamp().getTime()) : null;
            this.comment = source.getComment();
            this.id = source.getId();
            this.workspaces = source.getWorkspaces().slice();
            this.publishInfo = source.getPublishInfo();
            this.workflowInfo = source.getWorkflowInfo();
            this.permissionsChanged = source.isPermissionsChanged();
            this.path = source.getPath();
        }
    }

    fromJson(contentVersionJson: ContentVersionJson, workspaces?: string[]): ContentVersionBuilder {
        this.modifier = contentVersionJson.modifier;
        this.displayName = contentVersionJson.displayName;
        this.modified = contentVersionJson.modified ? new Date(contentVersionJson.modified) : null;
        this.childOrder = ChildOrder.fromJson(contentVersionJson.childOrder);
        this.timestamp = contentVersionJson.timestamp ? new Date(contentVersionJson.timestamp) : null;
        this.modifierDisplayName = contentVersionJson.modifierDisplayName;
        this.comment = contentVersionJson.comment;
        this.id = contentVersionJson.id;
        this.workspaces = workspaces || [];
        this.publishInfo = ContentVersionPublishInfo.fromJson(contentVersionJson.publishInfo);
        this.workflowInfo = Workflow.fromJson(contentVersionJson.workflow);
        this.permissionsChanged = contentVersionJson.permissionsChanged || false;
        this.path = contentVersionJson.path;

        return this;
    }

    build(): ContentVersion {
        return new ContentVersion(this);
    }
}
