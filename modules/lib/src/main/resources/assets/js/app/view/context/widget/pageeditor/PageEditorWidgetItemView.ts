import {i18n} from 'lib-admin-ui/util/Messages';
import {PEl} from 'lib-admin-ui/dom/PEl';
import {PageEditorData} from '../../../../wizard/page/LiveFormPanel';
import {WidgetItemView} from '../../WidgetItemView';

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
        noPreviewContainer.setHtml(i18n('text.nocontrollers'));
        this.appendChild(noPreviewContainer);
    }
}
