import {ContentVersionPublishInfoJson} from './resource/json/ContentVersionPublishInfoJson';
import {Cloneable} from 'lib-admin-ui/Cloneable';
import {ContentPublishInfo} from './ContentPublishInfo';

export class ContentVersionPublishInfo
implements Cloneable {

    private message: string;

    private publisherDisplayName: string;

    private publisher: string;

    private timestamp: Date;

    private contentPublishInfo: ContentPublishInfo;

    private constructor(source?: ContentVersionPublishInfo) {
        if (source) {
            this.message = source.getMessage();
            this.publisherDisplayName = source.getPublisherDisplayName();
            this.publisher = source.getPublisher();
            this.timestamp = !!source.getTimestamp() ? new Date(source.getTimestamp().getTime()) : null;
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

    getFirstPublished(): Date {
        return this.contentPublishInfo.getFirst();
    }

    getPublishedFrom(): Date {
        return this.contentPublishInfo.getFrom();
    }

    getPublishedTo(): Date {
        return this.contentPublishInfo.getTo();
    }

    getPublishDate(): Date {
        return new Date(Math.max(Number(this.timestamp), Number(this.contentPublishInfo.getFrom())));
    }
}
