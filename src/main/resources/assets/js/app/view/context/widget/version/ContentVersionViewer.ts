import {ContentVersion} from '../../../../ContentVersion';
import WorkflowState = api.content.WorkflowState;
import DateHelper = api.util.DateHelper;

export class ContentVersionViewer
    extends api.ui.Viewer<ContentVersion> {

    private namesAndIconView: api.app.NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.small).build();
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
