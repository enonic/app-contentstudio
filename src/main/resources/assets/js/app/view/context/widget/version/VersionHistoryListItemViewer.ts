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
        const isActiveAndNotRepublished = !version.isRepublished() && !!version.getActiveFrom();
        const dateTime = isActiveAndNotRepublished ? version.getActiveFrom() : version.getDateTime();
        let dateTimeToString = DateHelper.getFormattedTimeFromDate(dateTime);

        if (isActiveAndNotRepublished && version.getActiveFrom() < version.getDateTime()) {
            // Publishing can be set in the past, even before creation date.
            // To not break the logical sequence in the Version History, such publishing will still be shown based
            // on version.getDateTime() but display FULL date/time from which the publishing was made active.
            dateTimeToString = DateHelper.formatDateTime(dateTime, false);
        }

        return `${dateTimeToString} ${version.getStatus()}`;
    }

    resolveSubName(version: VersionHistoryItem): string {
        return i18n('widget.versionhistory.byUser', version.getUser());
    }

    setObject(version: VersionHistoryItem) {
        this.toggleClass('publish-action', version.isPublishAction());
        this.toggleClass('active', version.isActive());
        return super.setObject(version);
    }
}
