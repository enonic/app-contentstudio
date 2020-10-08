import {ContentVersion} from '../../../../ContentVersion';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {i18n} from 'lib-admin-ui/util/Messages';

export class VersionViewer
    extends NamesAndIconViewer<ContentVersion> {

    constructor() {
        super('version-viewer');
    }

    resolveIconClass(version: ContentVersion): string {
        return version.isInReadyState() ? 'icon-state-ready' : 'icon-version-modified';
    }

    resolveDisplayName(version: ContentVersion): string {
        return `${DateHelper.getFormattedTimeFromDate(version.getModified())}`;
    }

    resolveSubName(version: ContentVersion): string {
        return i18n('dialog.compareVersions.versionSubName', '', version.getModifierDisplayName());
    }

    setObject(version: ContentVersion) {
        this.toggleClass('divider', version.isActive() && !version.isAlias());

        return super.setObject(version);
    }
}
