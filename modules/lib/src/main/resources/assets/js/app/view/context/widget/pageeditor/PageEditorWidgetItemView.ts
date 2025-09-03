import {WidgetItemView} from '../../WidgetItemView';
import {ContextWindow} from '../../../../wizard/page/contextwindow/ContextWindow';

export class PageEditorWidgetItemView
    extends WidgetItemView {

    constructor() {
        super('page-editor-widget-item-view');
    }

    appendContextWindow(contextWindow: ContextWindow) {
        if (contextWindow && !this.hasChild(contextWindow)) {
            this.appendChild(contextWindow);
        }
    }
}
