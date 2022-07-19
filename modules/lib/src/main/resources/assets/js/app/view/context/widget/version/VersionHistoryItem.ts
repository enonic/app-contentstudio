import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {ContentVersion} from '../../../../ContentVersion';
import {ContentId} from '../../../../content/ContentId';

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
    PERMISSIONS = 'permissions'
}

export interface CreateParams {
    createdDate?: Date;
    isSort?: boolean;
    isPermissionChange?: boolean;
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

    constructor(builder: VersionHistoryItemBuilder) {
        this.contentId = builder.contentId;
        this.user = builder.user;
        this.dateTime = builder.dateTime;
        this.activeFrom = builder.activeFrom;
        this.activeTo = builder.activeTo;
        this.status = builder.status;
        this.iconCls = builder.iconCls;
        this.message = builder.message;
        this.skipDate = builder.skipDate;
        this.republished = builder.republished;
        this.version = builder.version;
        this.alias = builder.alias;
    }

    static fromPublishInfo(contentVersion: ContentVersion): VersionHistoryItemBuilder {
        const builder: VersionHistoryItemBuilder = new VersionHistoryItemBuilder();
        const publishInfo: ContentVersionPublishInfo = contentVersion.getPublishInfo();

        builder.setVersion(contentVersion)
            .setDateTime(publishInfo.getTimestamp())
            .setUser(publishInfo.getPublisherDisplayName() || publishInfo.getPublisher());

        if (publishInfo.isPublished()) {
            if (publishInfo.isScheduled()) {
                builder.setStatus(VersionItemStatus.SCHEDULED).setIconCls('icon-clock');
            } else {
                builder.setStatus(VersionItemStatus.PUBLISHED)
                    .setIconCls('icon-version-published')
                    .setActiveFrom(publishInfo.getPublishedFrom());
            }
            builder.setActiveTo(publishInfo.getPublishedTo());
        } else if (publishInfo.isUnpublished()) {
            builder.setIconCls('icon-version-unpublished').setStatus(VersionItemStatus.UNPUBLISHED);
        } else if (publishInfo.isArchived()) {
            builder.setIconCls('icon-archive').setStatus(VersionItemStatus.ARCHIVED);
        } else if (publishInfo.isRestored()) {
            builder.setIconCls('icon-restore').setStatus(VersionItemStatus.RESTORED);
        }

        builder.setMessage(publishInfo.getMessage());

        return builder;
    }

    static fromContentVersion(contentVersion: ContentVersion, createParams: CreateParams): VersionHistoryItemBuilder {
        const builder: VersionHistoryItemBuilder = new VersionHistoryItemBuilder();

        builder.setVersion(contentVersion)
            .setDateTime(createParams.createdDate || contentVersion.getTimestamp())
            .setUser(contentVersion.getModifierDisplayName() || contentVersion.getModifier());

        if (createParams.createdDate) {
            builder.setIconCls('icon-wand').setStatus(VersionItemStatus.CREATED);
        } else if (createParams.isSort) {
            builder.setIconCls('icon-sort-amount-asc').setStatus(VersionItemStatus.SORTED);
        } else if (createParams.isPermissionChange) {
            builder.setIconCls('icon-masks').setStatus(VersionItemStatus.PERMISSIONS);
        } else if (contentVersion.isInReadyState()) {
            builder.setIconCls('icon-state-ready').setStatus(VersionItemStatus.MARKED_AS_READY);
        } else {
            builder.setIconCls('icon-version-modified').setStatus(VersionItemStatus.EDITED);
        }

        return builder;
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

    isPermissionsUpdated(): boolean {
        return this.status === VersionItemStatus.PERMISSIONS;
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

    createAlias(displayName: string, type: AliasType): VersionHistoryItem {
        const versionAliasBuilder: VersionHistoryItemBuilder = this.clone();
        const alias = new VersionHistoryItemAlias(displayName, type);
        versionAliasBuilder.alias = alias;

        return versionAliasBuilder.build();
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
