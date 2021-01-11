import {ContentVersion} from '../../../../ContentVersion';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {i18n} from 'lib-admin-ui/util/Messages';
import {VersionHistoryItem} from './VersionHistoryItem';

export class ContentVersionViewer
    extends Viewer<ContentVersion> {

    protected namesAndIconView: NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        this.appendChild(this.namesAndIconView);
    }

    getPreferredHeight(): number {
        return 50;
    }

    private getIconClass(version: ContentVersion): string {
        if (version.isPublished()) {
            if (version.getPublishInfo().isScheduled()) {
                return 'icon-clock';
            }
            return 'icon-version-published';
        }
        if (version.isUnpublished()) {
            return 'icon-version-unpublished';
        }
        if (version.isInReadyState()) {
            return 'icon-state-ready';
        }

        return 'icon-version-modified';
    }

    setObject(version: ContentVersion) {
        const displayDate = version.getDisplayDate();
        const displayName = version.hasPublishInfo() ?
                             version.getPublishInfo().getPublisherDisplayName() : version.getModifierDisplayName();
        const isAlias = version.isAlias();
        const dateTime = `${DateHelper.formatDate(displayDate)} ${DateHelper.getFormattedTimeFromDate(displayDate, false)}`;
        const subName = i18n('dialog.compareVersions.versionSubName', isAlias ? dateTime : '', displayName);

        this.toggleClass('divider', version.isActive() && !version.isAlias());

        this.namesAndIconView
            .setMainName(isAlias ? version.getAliasDisplayName() : dateTime)
            .setSubName(subName)
            .setIconClass(this.getIconClass(version));

        return super.setObject(version);
    }
}
