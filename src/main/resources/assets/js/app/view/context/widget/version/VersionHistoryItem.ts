import {ContentVersion} from '../../../../ContentVersion';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';
import {i18n} from 'lib-admin-ui/util/Messages';

export class VersionHistoryItem {

    private id: string;

    private user: string;

    private dateTime: Date;

    private status: string;

    private iconCls: string;

    private message: string;

    private active: boolean;

    private first: boolean;

    private revertable: boolean;

    private readonly skipDate: boolean;

    constructor(skipDate: boolean = false) {
        this.skipDate = skipDate;
    }

    static fromPublishInfo(publishInfo: ContentVersionPublishInfo, skipDate: boolean = false): VersionHistoryItem {
        const item = new VersionHistoryItem(skipDate);

        item.active = false;
        item.revertable = false;
        item.dateTime = publishInfo.getTimestamp();
        item.user = publishInfo.getPublisherDisplayName();
        if (publishInfo.isPublished()) {
            item.iconCls = 'icon-version-published';
            item.status = i18n('status.published');
        } else if (publishInfo.isUnpublished()) {
            item.iconCls = 'icon-version-unpublished';
            item.status = i18n('status.unpublished');
        }
        item.message = publishInfo.getMessage();

        return item;
    }

    static fromContentVersion(contentVersion: ContentVersion, skipDate: boolean = false): VersionHistoryItem {
        const item = new VersionHistoryItem(skipDate);

        item.id = contentVersion.getId();
        item.active = contentVersion.isActive();
        item.revertable = !contentVersion.isActive();
        item.dateTime = contentVersion.getModified();
        item.user = contentVersion.getModifierDisplayName();
        if (contentVersion.isInReadyState()) {
            item.iconCls = 'icon-state-ready';
            item.status = i18n('status.markedAsReady');
        } else {
            item.iconCls = 'icon-version-modified';
            item.status = i18n('status.modified');
        }

        return item;
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
