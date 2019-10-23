import {Element} from 'lib-admin-ui/dom/Element';
import {Viewer} from 'lib-admin-ui/ui/Viewer';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {ContentVersion} from '../../../../ContentVersion';
import {WorkflowState} from 'lib-admin-ui/content/WorkflowState';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {DateHelper} from 'lib-admin-ui/util/DateHelper';

export class ContentVersionViewer
    extends Viewer<ContentVersion> {

    private namesAndIconView: NamesAndIconView;

    constructor() {
        super();
        this.namesAndIconView = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small).build();
        this.appendChild(this.namesAndIconView);
    }

    private getModifierSpan(contentVersion: ContentVersion): SpanEl {
        let span = new SpanEl('version-modifier');

        span.setHtml(DateHelper.getModifiedString(contentVersion.modified));

        return span;
    }

    private getSubNameElements(contentVersion: ContentVersion): Element[] {
        return [this.getModifierSpan(contentVersion)];
    }

    setObject(contentVersion: ContentVersion, row?: number) {

        //TODO: use content version image and number instead of row
        this.namesAndIconView
            .setMainName(contentVersion.modifierDisplayName)
            .setSubNameElements(this.getSubNameElements(contentVersion))
            .setIconClass(contentVersion.publishInfo ? 'icon-version-published' : contentVersion.workflowInfo && WorkflowState.READY ===
                                                                                  contentVersion.workflowInfo.getState()
                                                                                  ? 'icon-state-ready'
                                                                                  : 'icon-version-modified');

        return super.setObject(contentVersion);
    }
}
