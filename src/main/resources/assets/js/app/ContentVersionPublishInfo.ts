import {ContentVersionPublishInfoJson} from './resource/json/ContentVersionPublishInfoJson';

export class ContentVersionPublishInfo {

    message: string;

    publisherDisplayName: string;

    publisher: string;

    timestamp: Date;

    static fromJson(contentVersionPublishInfoJson: ContentVersionPublishInfoJson): ContentVersionPublishInfo {

        if (!contentVersionPublishInfoJson) {
            return null;
        }

        let contentVersionPublishInfo: ContentVersionPublishInfo = new ContentVersionPublishInfo();

        contentVersionPublishInfo.message = contentVersionPublishInfoJson.message;
        contentVersionPublishInfo.publisher = contentVersionPublishInfoJson.publisher;
        contentVersionPublishInfo.publisherDisplayName = contentVersionPublishInfoJson.publisherDisplayName;
        contentVersionPublishInfo.timestamp = new Date(contentVersionPublishInfoJson.timestamp);

        return contentVersionPublishInfo;
    }
}
