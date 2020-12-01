import {ContentVersionJson} from './resource/json/ContentVersionJson';
import {ContentVersionPublishInfo} from './ContentVersionPublishInfo';
import {Workflow} from 'lib-admin-ui/content/Workflow';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {Cloneable} from 'lib-admin-ui/Cloneable';

export class ContentVersion implements Cloneable {

    private modifier: string;

    private modifierDisplayName: string;

    private displayName: string;

    private modified: Date;

    private comment: string;

    private id: string;

    private workspaces: string[];

    private publishInfo: ContentVersionPublishInfo;

    private workflowInfo: Workflow;

    private alias: ContentVersionAlias;

    private active: boolean = false;

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

        if (this.publishInfo && this.publishInfo.getPublishedFrom()) {
            if (ContentVersion.equalDates(this.publishInfo.getPublishedFrom(), this.publishInfo.getTimestamp())) {
                // Version date/time and publishFrom on the server might be off by several milliseconds, in this case make them equal
                this.publishInfo.setPublishedFrom(this.publishInfo.getTimestamp());
            }
        }
    }

    static fromJson(contentVersionJson: ContentVersionJson, workspaces?: string[]): ContentVersion {
        return new ContentVersionBuilder().fromJson(contentVersionJson, workspaces).build();
    }

    static equalDates(date1: Date, date2: Date): boolean {
        return Math.abs(Number(date1) - Number(date2)) < 500; // Allow 500 ms difference
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

        return this.getModified();
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

    newBuilder(): ContentVersionBuilder {
        return new ContentVersionBuilder(this);
    }

    isAlias(): boolean {
        return !!this.alias;
    }

    getAlias(): ContentVersionAlias {
        return this.alias;
    }

    getAliasType(): AliasType {
        if (!this.isAlias()) {
            return null;
        }

        return this.getAlias().getType();
    }

    getAliasDisplayName(): string {
        if (!this.isAlias()) {
            return null;
        }

        return this.getAlias().getDisplayName();
    }

    createAlias(displayName: string, type: AliasType): ContentVersion {
        const versionAlias = this.clone();
        const alias = new ContentVersionAlias(displayName, type);
        versionAlias.alias = alias;
        versionAlias.active = this.active;

        return versionAlias;
    }

    clone(): ContentVersion {
        return this.newBuilder().build();
    }

    isActive(): boolean {
        return this.active;
    }

    setActive(value: boolean) {
        this.active = value;
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

export enum AliasType {
    NEWEST, PUBLISHED, NEXT, PREV
}

export class ContentVersionAlias {
    private displayName: string;

    private type: AliasType;

    constructor(displayName: string, type: AliasType, divider: boolean = false) {
        this.displayName = displayName;

        this.type = type;
    }

    getType(): AliasType {
        return this.type;
    }

    getDisplayName(): string {
        return this.displayName;
    }
}
