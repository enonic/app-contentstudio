import {ContentVersionPublishInfoJson} from './resource/json/ContentVersionPublishInfoJson';
import {Cloneable} from 'lib-admin-ui/Cloneable';

export class ContentVersionPublishInfo
implements Cloneable {

    private message: string;

    private publisherDisplayName: string;

    private publisher: string;

    private timestamp: Date;

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
}
