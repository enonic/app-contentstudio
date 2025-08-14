import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentId} from './content/ContentId';
import {ContentVersion} from './ContentVersion';
import {GetActiveContentVersionsRequest} from './resource/GetActiveContentVersionsRequest';
import {VersionContext} from './view/context/widget/version/VersionContext';
import Q from 'q';

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

    public static getVersionById(versions: ContentVersion[], versionId: string): ContentVersion | undefined {
        return versions.find((version: ContentVersion) => version.getId() === versionId);
    }

    public static fetchAndSetActiveVersion(contentId: ContentId): Q.Promise<void> {
        return new GetActiveContentVersionsRequest(contentId).sendAndParse().then((activeVersions) => {
            const activeVersion = activeVersions.shift()?.getContentVersion();

            if (activeVersion) {
                VersionContext.setActiveVersion(contentId.toString(), activeVersion.getId());
            }
        }).catch(DefaultErrorHandler.handle);
    }
}
