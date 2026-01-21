import {ExtensionItemView} from '../../ExtensionItemView';
import {type ContextWindow} from '../../../../wizard/page/contextwindow/ContextWindow';

export class ExtensionPageEditorItemView
    extends ExtensionItemView {

    constructor() {
        super('extensions-page-editor-item-view');
    }

    appendContextWindow(contextWindow: ContextWindow) {
        if (contextWindow && !this.hasChild(contextWindow)) {
            this.appendChild(contextWindow);
        }
    }
}
