import {ContentVersion} from '../../../../ContentVersion';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';

export class ContentVersionViewer
    extends Viewer<ContentVersion> {

    private namesAndIconView: NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        this.appendChild(this.namesAndIconView);
    }
    getPreferredHeight(): number {
        return 50;
    }

    setObject(contentVersion: ContentVersion, row?: number) {

        this.namesAndIconView
            .setMainName(contentVersion.modifierDisplayName)
            .setSubName(DateHelper.getModifiedString(contentVersion.modified))
            .setIconClass(contentVersion.publishInfo
                ? 'icon-version-published'
                : contentVersion.workflowInfo && WorkflowState.READY === contentVersion.workflowInfo.getState()
                    ? 'icon-state-ready'
                    : 'icon-version-modified');

        return super.setObject(contentVersion);
    }
}
