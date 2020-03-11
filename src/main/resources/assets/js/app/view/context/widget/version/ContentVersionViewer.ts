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
        const modifiedDate = version.getModified();
        const isAlias = version.isAlias();
        const dateTime = `${DateHelper.formatDate(modifiedDate)} ${DateHelper.getFormattedTimeFromDate(modifiedDate, false)}`;
        const subName = i18n('dialog.compareVersions.versionSubName', isAlias ? dateTime : '', version.getModifierDisplayName());

        this.toggleClass('alias', isAlias);

        this.namesAndIconView
            .setMainName(isAlias ? version.getAliasDisplayName() : dateTime)
            .setSubName(subName)
            .setIconClass(version.hasPublishInfo()
                ? 'icon-version-published'
                : version.isInReadyState()
                    ? 'icon-state-ready'
                    : 'icon-version-modified');

        return super.setObject(version);
    }
}
