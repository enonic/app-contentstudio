import {ContentVersion} from './ContentVersion';

export class ContentVersionHelper {

    public static findPublishedVersionId(versions: ContentVersion[]): string | undefined {
        return versions.reduce((prevPublished, contentVersion) => {
            const publishInfo = contentVersion.getPublishInfo();
            const prevPublishInfo = prevPublished?.getPublishInfo();
            if (!prevPublishInfo && publishInfo?.isPublished()
                || publishInfo?.getTimestamp()?.getTime() > prevPublishInfo?.getTimestamp()?.getTime()) {
                return contentVersion;
            }
            return prevPublished;
        })?.getId();
    }
}
