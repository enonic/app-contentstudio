import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

export class VersionHistoryItem {

    private id: string;

    private user: string;

    private dateTime: Date;

    private activeFrom: Date;

    private activeTo: Date;

    private status: string;

    private iconCls: string;

    private message: string;

    private revertable: boolean;

    private skipDate: boolean = false;

    private activeVersionId: string;

    static fromPublishInfo(publishInfo: ContentVersionPublishInfo): VersionHistoryItem {
        const item: VersionHistoryItem = new VersionHistoryItem();

        item.revertable = false;
        item.dateTime = publishInfo.getTimestamp();
        item.user = publishInfo.getPublisherDisplayName();

        if (publishInfo.isPublished()) {
            if (publishInfo.isScheduled()) {
                item.status = i18n('status.scheduled');
                item.iconCls = 'icon-clock';
            } else {
                item.status = i18n('status.published');
                item.iconCls = 'icon-version-published';
                if (VersionHistoryItem.equalDates(publishInfo.getPublishedFrom(), item.dateTime)) {
                    // Version date/time and publishFrom on the server might be off by several milliseconds, in this case make them equal
                    item.activeFrom = item.dateTime;
                } else {
                    item.activeFrom = publishInfo.getPublishedFrom();
                }
            }
            item.activeTo = publishInfo.getPublishedTo();
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
            item.status = i18n('status.edited');
        }

        return item;
    }

    static equalDates(date1: Date, date2: Date): boolean {
        return Math.abs(Number(date1) - Number(date2)) < 1000;
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
        return this.activeVersionId === this.id;
    }

    skipsDate(): boolean {
        return this.skipDate;
    }
}
