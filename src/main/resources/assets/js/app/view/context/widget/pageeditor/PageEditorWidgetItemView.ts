import {WidgetItemView} from '../../WidgetItemView';
import {LiveEditPageProxy} from '../../../../wizard/page/LiveEditPageProxy';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {IsRenderableRequest} from '../../../../resource/IsRenderableRequest';
import {ContextData} from '../../ContextSplitPanel';
import i18n = api.util.i18n;
import PEl = api.dom.PEl;

export interface EmulatorWidgetItemViewConfig {
    liveEditPage?: LiveEditPageProxy;
}

export class PageEditorWidgetItemView
    extends WidgetItemView {

    constructor(config: ContextData) {
        super('page-editor-widget-item-view');

        this.initContextWindow();
        this.initNoPreviewMessageContainer();
    }

    private initContextWindow() {

    }

    private initNoPreviewMessageContainer() {
        const noPreviewContainer = new PEl('no-preview-message');
        noPreviewContainer.setHtml(i18n('field.preview.notAvailable'));
        this.appendChild(noPreviewContainer);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        return PageEditorWidgetItemView.isPreviewAvailable(item).then((available: boolean) => {
            this.toggleClass('no-preview', !available);
        });
    }

    private static isPreviewAvailable(item: ContentSummaryAndCompareStatus): wemQ.Promise<boolean> {
        return new IsRenderableRequest(item.getContentId()).sendAndParse();
    }
}
