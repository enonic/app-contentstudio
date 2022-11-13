import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {WidgetItemView} from '../../WidgetItemView';
import {ContextWindow} from '../../../../wizard/page/contextwindow/ContextWindow';

export class PageEditorWidgetItemView
    extends WidgetItemView {

    constructor() {
        super('page-editor-widget-item-view');

        this.initNoPreviewMessageContainer();
    }

    appendContextWindow(contextWindow: ContextWindow) {
        if (contextWindow && !this.hasChild(contextWindow)) {
            this.appendChild(contextWindow);
        }
    }

    private initNoPreviewMessageContainer() {
        const noPreviewContainer = new PEl('no-controller-message');
        noPreviewContainer.setHtml(i18n('text.nocontrollers'));
        this.appendChild(noPreviewContainer);
    }
}
