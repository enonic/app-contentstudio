import {type ContentVersionPublishInfoJson} from './resource/json/ContentVersionPublishInfoJson';
import {type Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {ContentPublishInfo} from './ContentPublishInfo';

enum COMMIT_TYPE {
    PUBLISHED, UNPUBLISHED, ARCHIVED, RESTORED, CUSTOM
}

export class ContentVersionPublishInfo
implements Cloneable {

    private message: string;

    private publisherDisplayName: string;

    private publisher: string;

    private timestamp: Date;

    private type: string;

    private contentPublishInfo: ContentPublishInfo;

    private constructor(source?: ContentVersionPublishInfo) {
        if (source) {
            this.message = source.getMessage();
            this.publisherDisplayName = source.getPublisherDisplayName();
            this.publisher = source.getPublisher();
            this.type = source.getType();
            this.timestamp = source.getTimestamp() ? new Date(source.getTimestamp().getTime()) : null;
        }
    }

    clone(): ContentVersionPublishInfo {
        return new ContentVersionPublishInfo(this);
    }

    static fromJson(contentVersionPublishInfoJson: ContentVersionPublishInfoJson): ContentVersionPublishInfo {
        if (!contentVersionPublishInfoJson) {
            return null;
        }

        const contentVersionPublishInfo: ContentVersionPublishInfo = new ContentVersionPublishInfo();

        contentVersionPublishInfo.message = contentVersionPublishInfoJson.message;
        contentVersionPublishInfo.publisher = contentVersionPublishInfoJson.publisher;
        contentVersionPublishInfo.publisherDisplayName = contentVersionPublishInfoJson.publisherDisplayName;
        contentVersionPublishInfo.timestamp = new Date(contentVersionPublishInfoJson.timestamp);
        contentVersionPublishInfo.type = contentVersionPublishInfoJson.type;
        contentVersionPublishInfo.contentPublishInfo = ContentPublishInfo.fromJson(contentVersionPublishInfoJson.contentPublishInfo);

        return contentVersionPublishInfo;
    }

    getMessage(): string {
        return this.message;
    }

    getPublisherDisplayName(): string {
        return this.publisherDisplayName;
    }

    getPublisher(): string {
        return this.publisher;
    }

    getTimestamp(): Date {
        return this.timestamp;
    }

    getType(): string {
        return this.type;
    }

    getFirstPublished(): Date {
        return this.contentPublishInfo?.getFirst();
    }

    getPublishedFrom(): Date {
        return this.contentPublishInfo?.getFrom();
    }

    getPublishedTo(): Date {
        return this.contentPublishInfo?.getTo();
    }

    setPublishedFrom(date: Date) {
        return this.contentPublishInfo.setFrom(date);
    }

    isPublished(): boolean {
        if (!this.contentPublishInfo) {
            return false;
        }
        return !!this.getPublishedFrom() || !!this.getPublishedTo();
    }

    isUnpublished(): boolean {
        if (!this.contentPublishInfo) {
            return false;
        }

        return !this.getPublishedFrom() && !this.getPublishedTo();
    }

    isArchived(): boolean {
        return this.getType() === COMMIT_TYPE[COMMIT_TYPE.ARCHIVED].toString();
    }

    isRestored(): boolean {
        return this.getType() === COMMIT_TYPE[COMMIT_TYPE.RESTORED].toString();
    }

    isScheduled(): boolean {
        if (!this.isPublished()) {
            return false;
        }
        return this.getPublishedFrom() > this.getTimestamp() && this.getPublishedFrom() > new Date(Date.now());
    }

    isCustom(): boolean {
        return this.getType() === COMMIT_TYPE[COMMIT_TYPE.CUSTOM].toString();
    }

    isEmpty(): boolean {
        return !this.contentPublishInfo;
    }
}
