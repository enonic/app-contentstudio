import {Element} from 'lib-admin-ui/dom/Element';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {ContentVersion} from '../../../../ContentVersion';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {i18n} from 'lib-admin-ui/util/i18n';

export class ContentVersionViewer
    extends Viewer<ContentVersion> {

    private namesAndIconView: NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        this.appendChild(this.namesAndIconView);
    }

    private formatSubName(contentVersion: ContentVersion): string {
        return i18n('widget.contentversion.modifiedBy', DateHelper.getModifiedString(contentVersion.modified),
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
