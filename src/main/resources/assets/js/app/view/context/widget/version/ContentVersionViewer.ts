import '../../../../../api.ts';
import {ContentVersion} from '../../../../ContentVersion';
import WorkflowState = api.content.WorkflowState;
import i18n = api.util.i18n;

export class ContentVersionViewer
    extends api.ui.Viewer<ContentVersion> {

    private namesAndIconView: api.app.NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new api.app.NamesAndIconViewBuilder().setSize(api.app.NamesAndIconViewSize.small).build();
        this.appendChild(this.namesAndIconView);
    }

    private formatSubName(contentVersion: ContentVersion): string {
        return i18n('widget.contentversion.modifiedBy', api.util.DateHelper.getModifiedString(contentVersion.modified),
            contentVersion.modifierDisplayName);
    }

    getPreferredHeight(): number {
        return 50;
    }

    setObject(contentVersion: ContentVersion, row?: number) {

        this.namesAndIconView
            .setMainName(contentVersion.comment ? contentVersion.comment : contentVersion.displayName
                                                                           ? contentVersion.displayName
                                                                           : contentVersion.id)
            .setSubName(this.formatSubName(contentVersion))
            .setIconClass(contentVersion.publishInfo ? 'icon-version-published' : contentVersion.workflowInfo && WorkflowState.READY ===
                                                                                  contentVersion.workflowInfo.getState()
                                                                                  ? 'icon-state-ready'
                                                                                  : 'icon-version-modified');

        return super.setObject(contentVersion);
    }
}
