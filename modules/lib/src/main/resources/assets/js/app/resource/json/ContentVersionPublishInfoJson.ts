import {type ContentPublishInfoJson} from './ContentPublishInfoJson';

export interface ContentVersionPublishInfoJson {

    message: string;

    publisherDisplayName: string;

    publisher: string;

    timestamp: string;

    type: string;

    contentPublishInfo: ContentPublishInfoJson;
}
