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
        const dateTime = `${DateHelper.formatDate(version.modified)} ${DateHelper.getFormattedTimeFromDate(version.modified, false)}`;

        this.removeClass('divider');
        if (versionAndAlias.alias) {
            this.namesAndIconView
                .setMainName(alias)
                .setSubName(i18n('dialog.compareVersions.aliasSubName', dateTime, version.modifierDisplayName))
                .setIconClass(version.publishInfo
                              ? 'icon-version-published'
                              : version.workflowInfo && WorkflowState.READY === version.workflowInfo.getState()
                                ? 'icon-state-ready'
                                : 'icon-version-modified');

            if (versionAndAlias.divider) {
                this.addClass('divider');
            }
        } else {
            this.namesAndIconView
                .setMainName(dateTime)
                .setSubName(i18n('dialog.compareVersions.nonAliasSubName', version.modifierDisplayName))
                .setIconClass(version.publishInfo
                              ? 'icon-version-published'
                              : version.workflowInfo && WorkflowState.READY === version.workflowInfo.getState()
                                ? 'icon-state-ready'
                                : 'icon-version-modified');
        }


        // consider it a divider
        //this.toggleClass('divider', !version);
        return super.setObject(versionAndAlias);
    }
}
