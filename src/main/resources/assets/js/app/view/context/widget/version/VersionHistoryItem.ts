import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';
import {i18n} from 'lib-admin-ui/util/Messages';

export class VersionHistoryItem {

    private id: string;

    private user: string;

    private dateTime: Date;

    private activeFrom: Date;

    private activeTo: Date;

    private status: string;

    private iconCls: string;

    private message: string;

    private active: boolean;

    private revertable: boolean;

    private skipDate: boolean = false;

    static fromPublishInfo(publishInfo: ContentVersionPublishInfo): VersionHistoryItem {
        const item: VersionHistoryItem = new VersionHistoryItem();

        item.active = false;
        item.revertable = false;
        item.dateTime = publishInfo.getTimestamp();
        item.user = publishInfo.getPublisherDisplayName();

        if (publishInfo.isPublished()) {
            if (publishInfo.getPublishedFrom() > publishInfo.getTimestamp()) {
                item.activeFrom = publishInfo.getPublishedFrom();
            }
            item.activeTo = publishInfo.getPublishedTo();
            item.iconCls = 'icon-version-published';
            item.status = i18n('status.published');
        } else if (publishInfo.isUnpublished()) {
            item.iconCls = 'icon-version-unpublished';
            item.status = i18n('status.unpublished');
        }

        item.message = publishInfo.getMessage();

        return item;
    }

    static fromContentVersion(contentVersion: ContentVersion, isFirst: boolean = false): VersionHistoryItem {
        const item: VersionHistoryItem = new VersionHistoryItem();

        item.id = contentVersion.getId();
        item.active = contentVersion.isActive();
        item.revertable = !contentVersion.isActive();
        item.dateTime = contentVersion.getModified();
        item.user = contentVersion.getModifierDisplayName();

        if (isFirst) {
            item.iconCls = 'icon-wand';
            item.status = i18n('status.created');
        } else if (contentVersion.isInReadyState()) {
            item.iconCls = 'icon-state-ready';
            item.status = i18n('status.markedAsReady');
        } else {
            item.iconCls = 'icon-version-modified';
            item.status = i18n('status.modified');
        }

        return item;
    }

    setSkipDate(value: boolean): VersionHistoryItem {
        this.skipDate = value;
        return this;
    }

    isPublishAction(): boolean {
        return !this.id;
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

    getStatus(): string {
        return this.status;
    }

    getMessage(): string {
        return this.message ? this.message.trim() : undefined;
    }

    isRevertable(): boolean {
        return this.revertable;
    }

    isActive(): boolean {
        return this.active;
    }

    skipsDate(): boolean {
        return this.skipDate;
    }
}
