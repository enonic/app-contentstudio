import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {i18n} from 'lib-admin-ui/util/Messages';
import {VersionHistoryItem} from './VersionHistoryItem';

export class VersionViewer
    extends NamesAndIconViewer<VersionHistoryItem> {

    resolveIconClass(version: VersionHistoryItem): string {
        return version.getIconCls() || '';
    }

    resolveDisplayName(version: VersionHistoryItem): string {
        return `${DateHelper.getFormattedTimeFromDate(version.getDateTime())} ${version.getStatus()}`;
    }

    resolveSubName(version: VersionHistoryItem): string {
        return i18n('dialog.compareVersions.versionSubName', '', version.getUser());
    }

    setObject(version: VersionHistoryItem) {
        this.addClass(version.isPublishAction() ? 'version-action-viewer' : 'version-viewer');
        if (version.isActive()) {
            this.addClass('active');
        }
        return super.setObject(version);
    }
}
