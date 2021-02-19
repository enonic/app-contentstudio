import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {i18n} from 'lib-admin-ui/util/Messages';
import {VersionHistoryItem} from './VersionHistoryItem';

export class VersionHistoryListItemViewer
    extends NamesAndIconViewer<VersionHistoryItem> {

    constructor() {
        super('version-viewer');
    }

    resolveIconClass(version: VersionHistoryItem): string {
        return version.getIconCls() || '';
    }

    resolveDisplayName(version: VersionHistoryItem): string {
        const dateTimeToString = DateHelper.getFormattedTimeFromDate(version.getDateTime());

        return `${dateTimeToString} ${version.getStatus()}`;
    }

    resolveSubName(version: VersionHistoryItem): string {
        let publishedFrom = '';
        if (version.isPublishAction() && !version.isRepublished() && !version.isInstantlyPublished()) {
            publishedFrom = i18n('tooltip.from',DateHelper.formatDateTime(version.getActiveFrom(), false)) + ' ';
        }
        return publishedFrom + i18n('widget.versionhistory.byUser', version.getUser());
    }

    setObject(version: VersionHistoryItem) {
        this.toggleClass('publish-action', version.isPublishAction());
        this.toggleClass('active', version.isActive());
        return super.setObject(version);
    }
}
