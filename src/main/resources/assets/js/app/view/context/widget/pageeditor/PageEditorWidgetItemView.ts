import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {IsRenderableRequest} from '../../../../resource/IsRenderableRequest';
import {PageEditorData} from '../../../../wizard/page/LiveFormPanel';
import {WidgetItemView} from '../../WidgetItemView';
import PEl = api.dom.PEl;
import i18n = api.util.i18n;

export class PageEditorWidgetItemView
    extends WidgetItemView {

    constructor(config: PageEditorData) {
        super('page-editor-widget-item-view');

        this.initContextWindow(config);
        this.initNoPreviewMessageContainer();
    }

    private initContextWindow(config: PageEditorData) {
        this.appendChild(config.contextWindow);
    }

    private initNoPreviewMessageContainer() {
        const noPreviewContainer = new PEl('no-controller-message');
        noPreviewContainer.setHtml(i18n('live.view.page.nocontrollers'));
        this.appendChild(noPreviewContainer);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        return PageEditorWidgetItemView.isPreviewAvailable(item).then((available: boolean) => {
            this.toggleClass('no-controller', !available);
        });
    }

    private static isPreviewAvailable(item: ContentSummaryAndCompareStatus): wemQ.Promise<boolean> {
        return new IsRenderableRequest(item.getContentId()).sendAndParse();
    }
}
