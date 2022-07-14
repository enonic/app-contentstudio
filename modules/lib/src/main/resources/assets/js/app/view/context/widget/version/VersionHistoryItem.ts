import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ChildOrder} from '../../../../resource/order/ChildOrder';

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

export class VersionHistoryItem {

    private id: string;

    private user: string;

    private dateTime: Date;

    private activeFrom: Date;

    private activeTo: Date;

    private status: VersionItemStatus;

    private iconCls: string;

    private message: string;

    private skipDate: boolean = false;

    private activeVersionId: string;

    private republished: boolean = false;

    static fromPublishInfo(publishInfo: ContentVersionPublishInfo): VersionHistoryItem {
        const item: VersionHistoryItem = new VersionHistoryItem();

        item.dateTime = publishInfo.getTimestamp();
        item.user = publishInfo.getPublisherDisplayName() || publishInfo.getPublisher();

        if (publishInfo.isPublished()) {
            if (publishInfo.isScheduled()) {
                item.status = VersionItemStatus.SCHEDULED;
                item.iconCls = 'icon-clock';
            } else {
                item.status = VersionItemStatus.PUBLISHED;
                item.iconCls = 'icon-version-published';
                item.activeFrom = publishInfo.getPublishedFrom();
            }
            item.activeTo = publishInfo.getPublishedTo();
        } else if (publishInfo.isUnpublished()) {
            item.iconCls = 'icon-version-unpublished';
            item.status = VersionItemStatus.UNPUBLISHED;
        } else if (publishInfo.isArchived()) {
            item.iconCls = 'icon-archive';
            item.status = VersionItemStatus.ARCHIVED;
        } else if (publishInfo.isRestored()) {
            item.iconCls = 'icon-restore';
            item.status = VersionItemStatus.RESTORED;
        }

        item.message = publishInfo.getMessage();

        return item;
    }

    static fromContentVersion(contentVersion: ContentVersion, createParams: CreateParams): VersionHistoryItem {
        const item: VersionHistoryItem = new VersionHistoryItem();

        item.id = contentVersion.getId();
        item.dateTime = createParams.createdDate || contentVersion.getTimestamp();
        item.user = contentVersion.getModifierDisplayName() || contentVersion.getModifier();

        if (createParams.createdDate) {
            item.iconCls = 'icon-wand';
            item.status = VersionItemStatus.CREATED;
        } else if (createParams.isSort) {
            item.iconCls = 'icon-sort-amount-asc';
            item.status = VersionItemStatus.SORTED;
        } else if (createParams.isPermissionChange) {
            item.iconCls = 'icon-masks';
            item.status = VersionItemStatus.PERMISSIONS;
        } else if (contentVersion.isInReadyState()) {
            item.iconCls = 'icon-state-ready';
            item.status = VersionItemStatus.MARKED_AS_READY;
        } else {
            item.iconCls = 'icon-version-modified';
            item.status = VersionItemStatus.EDITED;
        }

        return item;
    }

    getActiveVersionId(): string {
        return this.activeVersionId;
    }

    setActiveVersionId(value: string): VersionHistoryItem {
        this.activeVersionId = value;
        return this;
    }

    setSkipDate(value: boolean): VersionHistoryItem {
        this.skipDate = value;
        return this;
    }

    setRepublished(value: boolean): VersionHistoryItem {
        this.republished = value;
        return this;
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
        return this.id;
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

    isActive(): boolean {
        return this.activeVersionId && this.activeVersionId === this.id;
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
}
