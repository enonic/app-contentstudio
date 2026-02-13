import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentId} from './content/ContentId';
import {type ContentVersion} from './ContentVersion';
import {GetActiveContentVersionsRequest} from './resource/GetActiveContentVersionsRequest';
import {RevertVersionRequest} from './resource/RevertVersionRequest';
import {VersionContext} from './view/context/widget/version/VersionContext';
import type Q from 'q';

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

    public static revert(contentId: ContentId, versionId: string, versionDate: Date) {
        const contentIdAsString: string = contentId.toString();

        new RevertVersionRequest(versionId, contentId)
            .sendAndParse()
            .then((newVersionId: string) => {
                if (newVersionId === VersionContext.getActiveVersion(contentIdAsString)) {
                    NotifyManager.get().showFeedback(i18n('notify.revert.noChanges'));
                    return;
                }

                const dateTime = `${DateHelper.formatDateTime(versionDate)}`;
                NotifyManager.get().showSuccess(i18n('notify.version.changed', dateTime));

                VersionContext.setActiveVersion(contentIdAsString, newVersionId);
            })
            .catch(DefaultErrorHandler.handle);
    }
}
