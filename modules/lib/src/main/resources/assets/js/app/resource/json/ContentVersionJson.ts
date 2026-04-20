import type {ContentPublishInfoJson} from './ContentPublishInfoJson';
import {type ContentVersionActionJson} from './ContentVersionActionJson';

export interface ContentVersionJson {

    timestamp: string;

    comment: string;

    id: string;

    publishInfo: ContentPublishInfoJson;

    path: string;

    actions: ContentVersionActionJson[];
}
