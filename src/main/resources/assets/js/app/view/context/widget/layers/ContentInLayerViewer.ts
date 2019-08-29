import '../../../../../api.ts';
import {ContentInLayer} from '../../../../content/ContentInLayer';
import {LayerIcon} from '../../../../layer/LayerIcon';
import {CompareStatusChecker} from '../../../../content/CompareStatus';
import i18n = api.util.i18n;
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';

export class ContentInLayerViewer
    extends api.ui.NamesAndIconViewer<ContentInLayer> {

    private content: ContentSummaryAndCompareStatus;

    constructor() {
        super();

        this.addClass('content-in-layer-viewer content-workflow-viewer');
    }

    setObjectAndContent(item: ContentInLayer, content: ContentSummaryAndCompareStatus) {
        super.setObject(item);
        this.content = content;
    }

    doLayout(object: ContentInLayer) {
        super.doLayout(object);

        this.toggleState(object);
    }

    resolveDisplayName(object: ContentInLayer): string {
        const displayName = object.getDisplayName();

        const language = object.getLanguage();

        if (language) {
            const languageStr = language ? `<span>(${language})</span>` : '';
            return displayName + ' ' + languageStr;
        }

        return displayName;
    }

    resolveSubName(object: ContentInLayer, relativePath: boolean = false): string {
        return object.getPath();
    }

    resolveIconEl(object: ContentInLayer): api.dom.Element {
        return this.content ? null : <api.dom.Element>new LayerIcon(object.getLayerLanguage());
    }

    resolveIconUrl(object: ContentInLayer): string {
        return this.content ? this.content.getIconUrl() : '';
    }

    private toggleState(object: ContentInLayer) {
        if (!object || CompareStatusChecker.isOnline(object.getStatus().getCompareStatus())) {
            return;
        }

        const workflowState: string = object.getWorkflow().getStateAsString();
        this.getNamesAndIconView().setIconToolTip(i18n(`status.workflow.${workflowState}`));

        this.toggleClass('ready', object.getWorkflow().isReady());
        this.toggleClass('in-progress', object.getWorkflow().isInProgress());
    }
}
