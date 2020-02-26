import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {ContentVersionAndAlias} from './ContentVersionAndAlias';
import {i18n} from 'lib-admin-ui/util/Messages';

export class ContentVersionAndAliasViewer
    extends Viewer<ContentVersionAndAlias> {

    private namesAndIconView: NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        this.appendChild(this.namesAndIconView);
    }

    getPreferredHeight(): number {
        return 50;
    }

    setObject(versionAndAlias: ContentVersionAndAlias, row?: number) {

        const version = versionAndAlias.contentVersion;
        const alias = versionAndAlias.alias;
        const dateTime = `${DateHelper.formatDate(version.getModified())} ${DateHelper.getFormattedTimeFromDate(version.getModified(), false)}`;

        this.removeClass('divider');
        if (versionAndAlias.alias) {
            this.namesAndIconView
                .setMainName(alias)
                .setSubName(i18n('dialog.compareVersions.aliasSubName', dateTime, version.getModifierDisplayName()))
                .setIconClass(version.hasPublishInfo()
                              ? 'icon-version-published'
                              : version.isInReadyState()
                                ? 'icon-state-ready'
                                : 'icon-version-modified');

        } else {
            this.namesAndIconView
                .setMainName(dateTime)
                .setSubName(i18n('dialog.compareVersions.nonAliasSubName', version.getModifierDisplayName()))
                .setIconClass(version.hasPublishInfo()
                              ? 'icon-version-published'
                              : version.isInReadyState()
                                ? 'icon-state-ready'
                                : 'icon-version-modified');

            if (versionAndAlias.divider) {
                this.addClass('divider');
            }
        }


        return super.setObject(versionAndAlias);
    }
}
