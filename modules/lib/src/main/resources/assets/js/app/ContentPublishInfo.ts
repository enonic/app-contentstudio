import {type Cloneable} from '@enonic/lib-admin-ui/Cloneable';
import {type ContentPublishInfoJson} from './resource/json/ContentPublishInfoJson';

export class ContentPublishInfo
implements Cloneable {

    private first: Date;

    private from: Date;

    private to: Date;

    private constructor(source?: ContentPublishInfo) {
        if (source) {
            this.first = source.getFirst() ? new Date(source.getFirst().getTime()) : null;
            this.from = source.getFrom() ? new Date(source.getFrom().getTime()) : null;
            this.to = source.getTo() ? new Date(source.getTo().getTime()) : null;
        }
    }

    clone(): ContentPublishInfo {
        return new ContentPublishInfo(this);
    }

    static fromJson(contentPublishInfoJson: ContentPublishInfoJson): ContentPublishInfo {
        if (!contentPublishInfoJson) {
            return null;
        }

        const contentPublishInfo: ContentPublishInfo = new ContentPublishInfo();

        contentPublishInfo.first = contentPublishInfoJson.first ? new Date(contentPublishInfoJson.first) : null;
        contentPublishInfo.from = contentPublishInfoJson.from ? new Date(contentPublishInfoJson.from) : null;
        contentPublishInfo.to = contentPublishInfoJson.to ? new Date(contentPublishInfoJson.to) : null;

        return contentPublishInfo;
    }

    getFirst(): Date {
        return this.first;
    }

    getFrom(): Date {
        return this.from;
    }

    getTo(): Date {
        return this.to;
    }

    setFrom(date: Date) {
        return this.from = date;
    }
}
