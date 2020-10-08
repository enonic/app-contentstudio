import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentVersionPublishInfo} from '../../../../ContentVersionPublishInfo';

export class VersionActionViewer
    extends NamesAndIconViewer<ContentVersionPublishInfo> {

    constructor() {
        super('version-action-viewer');
    }

    resolveIconClass(publishInfo: ContentVersionPublishInfo): string {
        if (publishInfo.isPublished()) {
            return 'icon-version-published';
        }
        if (publishInfo.isUnpublished()) {
            return 'icon-version-unpublished';
        }

        return '';
    }

    resolveDisplayName(publishInfo: ContentVersionPublishInfo): string {
        if (publishInfo.isEmpty()) {
            return '';
        }
        return `${DateHelper.getFormattedTimeFromDate(publishInfo.getTimestamp())}`;
    }

    resolveSubName(publishInfo: ContentVersionPublishInfo): string {
        if (publishInfo.isEmpty()) {
            return '';
        }
        return i18n('dialog.compareVersions.versionSubName', '', publishInfo.getPublisherDisplayName());
    }
}
