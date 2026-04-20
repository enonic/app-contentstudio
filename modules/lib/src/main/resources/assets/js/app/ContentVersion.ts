import type {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {ContentPublishInfo} from './ContentPublishInfo';
import {ContentVersionAction} from './ContentVersionAction';
import type {ContentVersionJson} from './resource/json/ContentVersionJson';

export class ContentVersion
    implements Cloneable {

    private readonly timestamp: Date;

    private readonly comment: string;

    private readonly id: string;

    private readonly workspaces: string[];

    private readonly publishInfo: ContentPublishInfo;

    private readonly path: string;

    private readonly actions: ContentVersionAction[];

    constructor(builder: ContentVersionBuilder) {
        this.timestamp = builder.timestamp;
        this.comment = builder.comment;
        this.id = builder.id;
        this.workspaces = builder.workspaces || [];
        this.publishInfo = builder.publishInfo;
        this.path = builder.path;
        this.actions = builder.actions || [];

        if (this.publishInfo?.getFrom()) {
            if (ContentVersion.equalDates(this.publishInfo.getFrom(), this.timestamp, 500)) {
                // Version date/time and publishFrom on the server might be off by several milliseconds, in this case make them equal
                this.publishInfo.setFrom(this.timestamp);
            }
        }
    }

    static fromJson(contentVersionJson: ContentVersionJson, workspaces?: string[]): ContentVersion {
        return new ContentVersionBuilder().fromJson(contentVersionJson, workspaces).build();
    }

    static equalDates(date1: Date, date2: Date, delta: number): boolean {
        return Math.abs(Number(date1) - Number(date2)) < delta; // Allow 500 ms difference
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
        return !!this.publishInfo?.getFrom();
    }

    isUnpublished(): boolean {
        return !!this.publishInfo && !this.publishInfo.getFrom();
    }

    isScheduled(): boolean {
        const from = this.publishInfo?.getFrom();
        return !!from && from > this.timestamp && from > new Date();
    }

    hasPublishInfo(): boolean {
        return !!this.publishInfo;
    }

    getPublishInfo(): ContentPublishInfo {
        return this.publishInfo;
    }

    getPath(): string {
        return this.path;
    }

    getActions(): ContentVersionAction[] {
        return this.actions.slice();
    }

    newBuilder(): ContentVersionBuilder {
        return new ContentVersionBuilder(this);
    }

    clone(): ContentVersion {
        return this.newBuilder().build();
    }
}

export class ContentVersionBuilder {
    timestamp: Date;

    comment: string;

    id: string;

    workspaces: string[];

    publishInfo: ContentPublishInfo;

    path: string;

    actions: ContentVersionAction[];

    constructor(source?: ContentVersion) {
        if (source) {
            this.timestamp = source.getTimestamp() ? new Date(source.getTimestamp().getTime()) : null;
            this.comment = source.getComment();
            this.id = source.getId();
            this.workspaces = source.getWorkspaces().slice();
            this.publishInfo = source.getPublishInfo();
            this.path = source.getPath();
            this.actions = source.getActions();
        }
    }

    fromJson(contentVersionJson: ContentVersionJson, workspaces?: string[]): ContentVersionBuilder {
        this.timestamp = contentVersionJson.timestamp ? new Date(contentVersionJson.timestamp) : null;
        this.comment = contentVersionJson.comment;
        this.id = contentVersionJson.id;
        this.workspaces = workspaces || [];
        this.publishInfo = ContentPublishInfo.fromJson(contentVersionJson.publishInfo);
        this.path = contentVersionJson.path;
        this.actions = contentVersionJson.actions?.map(ContentVersionAction.fromJson) ?? [];

        return this;
    }

    build(): ContentVersion {
        return new ContentVersion(this);
    }
}
