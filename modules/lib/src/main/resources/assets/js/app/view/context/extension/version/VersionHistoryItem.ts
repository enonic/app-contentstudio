import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {type ContentVersion} from '../../../../ContentVersion';
import {type ContentId} from '../../../../content/ContentId';

export enum VersionItemStatus {
    PUBLISHED = 'published',
    SCHEDULED = 'scheduled',
    UNPUBLISHED = 'unpublished',
    ARCHIVED = 'archived',
    RESTORED = 'restored',
    CREATED = 'created',
    MARKED_AS_READY = 'markedAsReady',
    EDITED = 'edited',
    SORTED = 'sorted',
    PERMISSIONS = 'permissions',
    MOVED = 'moved',
    RENAMED = 'renamed'
}

export class VersionHistoryItem implements Cloneable {

    private readonly contentId: ContentId;

    private readonly user: string;

    private readonly dateTime: Date;

    private readonly activeFrom: Date;

    private readonly activeTo: Date;

    private readonly status: VersionItemStatus;

    private readonly iconCls: string;

    private readonly message: string;

    private readonly skipDate: boolean;

    private readonly republished: boolean;

    private readonly version: ContentVersion;

    private readonly alias: VersionHistoryItemAlias;

    private readonly secondaryId?: string;

    private readonly readonly: boolean;

    private static statusClassMap: Map<VersionItemStatus, string> = VersionHistoryItem.initStatusClassMap();

    constructor(builder: VersionHistoryItemBuilder) {
        this.contentId = builder.contentId;
        this.user = builder.user;
        this.dateTime = builder.dateTime;
        this.activeFrom = builder.activeFrom;
        this.activeTo = builder.activeTo;
        this.status = builder.status;
        this.iconCls = builder.iconCls || VersionHistoryItem.statusClassMap.get(builder.status);
        this.message = builder.message;
        this.skipDate = builder.skipDate;
        this.republished = builder.republished;
        this.version = builder.version;
        this.alias = builder.alias;
        this.secondaryId = builder.secondaryId;
        this.readonly = !!builder.readonly;
    }

    private static initStatusClassMap(): Map<VersionItemStatus, string> {
        const map: Map<VersionItemStatus, string> = new Map<VersionItemStatus, string>;

        map.set(VersionItemStatus.CREATED, 'icon-wand');
        map.set(VersionItemStatus.SORTED, 'icon-sort-amount-asc');
        map.set(VersionItemStatus.MOVED, 'icon-tab');
        map.set(VersionItemStatus.PERMISSIONS, 'icon-masks');
        map.set(VersionItemStatus.MARKED_AS_READY, 'icon-state-ready');
        map.set(VersionItemStatus.EDITED, 'icon-version-modified');
        map.set(VersionItemStatus.SCHEDULED, 'icon-clock');
        map.set(VersionItemStatus.PUBLISHED, 'icon-version-published');
        map.set(VersionItemStatus.UNPUBLISHED, 'icon-version-unpublished');
        map.set(VersionItemStatus.ARCHIVED, 'icon-archive');
        map.set(VersionItemStatus.RESTORED, 'icon-restore');
        map.set(VersionItemStatus.RENAMED, 'icon-version-modified');

        return map;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getContentIdAsString(): string {
        return this.contentId.toString();
    }

    isRepublished(): boolean {
        return this.republished;
    }

    isInstantlyPublished(): boolean {
        if (!this.activeFrom) {
            return true;
        }
        return ObjectHelper.dateEquals(this.activeFrom, this.dateTime);
    }

    isPublishAction(): boolean {
        return this.status === VersionItemStatus.PUBLISHED ||
            this.status === VersionItemStatus.UNPUBLISHED ||
            this.status === VersionItemStatus.SCHEDULED;
    }

    getId(): string {
        return this.version.getId();
    }

    getUser(): string {
        return this.user;
    }

    getDateTime(): Date {
        return this.dateTime;
    }

    getActiveFrom(): Date {
        return this.activeFrom;
    }

    getActiveTo(): Date {
        return this.activeTo;
    }

    getIconCls(): string {
        return this.iconCls;
    }

    getStatus(): VersionItemStatus {
        return this.status;
    }

    getStatusAsString(): string {
        return i18n(`status.${this.status}`);
    }

    getMessage(): string {
        return this.message ? this.message.trim() : undefined;
    }

    skipsDate(): boolean {
        return this.skipDate;
    }

    isRestored(): boolean {
        return this.status === VersionItemStatus.RESTORED;
    }

    isArchived(): boolean {
        return this.status === VersionItemStatus.ARCHIVED;
    }

    isSorted(): boolean {
        return this.status === VersionItemStatus.SORTED;
    }

    isMoved(): boolean {
        return this.status === VersionItemStatus.MOVED;
    }

    isPermissions(): boolean {
        return this.status === VersionItemStatus.PERMISSIONS;
    }

    isRenamed(): boolean {
        return this.status === VersionItemStatus.RENAMED;
    }

    isMarkedAsReady(): boolean {
        return this.status === VersionItemStatus.MARKED_AS_READY;
    }

    getContentVersion(): ContentVersion {
        return this.version;
    }

    isAlias(): boolean {
        return !!this.alias;
    }

    getAlias(): VersionHistoryItemAlias {
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

    createAlias(displayName: string, type: AliasType, id: string): VersionHistoryItem {
        return this.clone().setAlias(new VersionHistoryItemAlias(displayName, type)).setSecondaryId(id).build();
    }

    getSecondaryId(): string {
        return this.secondaryId || `${this.getId()}:${this.getStatus()}`;
    }

    isReadonly(): boolean {
        return !!this.readonly;
    }

    clone(): VersionHistoryItemBuilder {
        return new VersionHistoryItemBuilder(this);
    }
}

export class VersionHistoryItemBuilder {

    contentId: ContentId;

    user: string;

    dateTime: Date;

    activeFrom: Date;

    activeTo: Date;

    status: VersionItemStatus;

    iconCls: string;

    message: string;

    skipDate: boolean = false;

    republished: boolean = false;

    version: ContentVersion;

    alias: VersionHistoryItemAlias;

    secondaryId: string;

    readonly: boolean;

    constructor(source?: VersionHistoryItem) {
        if (source) {
            this.contentId = source.getContentId();
            this.user = source.getUser();
            this.dateTime = source.getDateTime();
            this.activeFrom = source.getActiveFrom();
            this.activeTo = source.getActiveTo();
            this.status = source.getStatus();
            this.iconCls = source.getIconCls();
            this.message = source.getMessage();
            this.skipDate = source.skipsDate();
            this.republished = source.isRepublished();
            this.version = source.getContentVersion()?.clone();
            this.alias = source.getAlias();
            this.readonly = source.isReadonly();
        }
    }

    setContentId(value: ContentId): VersionHistoryItemBuilder {
        this.contentId = value;
        return this;
    }

    setUser(value: string): VersionHistoryItemBuilder {
        this.user = value;
        return this;
    }

    setDateTime(value: Date): VersionHistoryItemBuilder {
        this.dateTime = value;
        return this;
    }

    setActiveFrom(value: Date): VersionHistoryItemBuilder {
        this.activeFrom = value;
        return this;
    }

    setActiveTo(value: Date): VersionHistoryItemBuilder {
        this.activeTo = value;
        return this;
    }

    setStatus(value: VersionItemStatus): VersionHistoryItemBuilder {
        this.status = value;
        return this;
    }

    setIconCls(value: string): VersionHistoryItemBuilder {
        this.iconCls = value;
        return this;
    }

    setMessage(value: string): VersionHistoryItemBuilder {
        this.message = value;
        return this;
    }

    setSkipDate(value: boolean): VersionHistoryItemBuilder {
        this.skipDate = value;
        return this;
    }

    setRepublished(value: boolean): VersionHistoryItemBuilder {
        this.republished = value;
        return this;
    }

    setVersion(value: ContentVersion): VersionHistoryItemBuilder {
        this.version = value;
        return this;
    }

    setAlias(value: VersionHistoryItemAlias): VersionHistoryItemBuilder {
        this.alias = value;
        return this;
    }

    setSecondaryId(value: string): VersionHistoryItemBuilder {
        this.secondaryId = value;
        return this;
    }

    setReadonly(value: boolean): VersionHistoryItemBuilder {
        this.readonly = value;
        return this;
    }

    build(): VersionHistoryItem {
        return new VersionHistoryItem(this);
    }
}

export enum AliasType {
    NEWEST, PUBLISHED, NEXT, PREV
}

export class VersionHistoryItemAlias {
    private readonly displayName: string;

    private readonly type: AliasType;

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
