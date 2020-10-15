import {ContentVersion} from '../../../../ContentVersion';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {i18n} from 'lib-admin-ui/util/Messages';

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

    setObject(version: ContentVersion) {
        const modifiedDate = version.hasPublishInfo() ?
                             version.getPublishInfo().getTimestamp() : version.getModified();
        const modifierName = version.hasPublishInfo() ?
                             version.getPublishInfo().getPublisherDisplayName() : version.getModifierDisplayName();
        const isAlias = version.isAlias();
        const dateTime = `${DateHelper.formatDate(modifiedDate)} ${DateHelper.getFormattedTimeFromDate(modifiedDate, false)}`;
        const subName = i18n('dialog.compareVersions.versionSubName', isAlias ? dateTime : '', modifierName);

        this.toggleClass('divider', version.isActive() && !version.isAlias());

        this.namesAndIconView
            .setMainName(isAlias ? version.getAliasDisplayName() : dateTime)
            .setSubName(subName)
            .setIconClass(version.hasPublishInfo()
                          ? (version.isPublished() ? 'icon-version-published' : 'icon-version-unpublished')
                          : version.isInReadyState()
                            ? 'icon-state-ready'
                            : 'icon-version-modified');

        return super.setObject(version);
    }
}
