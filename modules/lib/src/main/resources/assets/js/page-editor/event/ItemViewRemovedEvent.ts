import type {ItemView} from '../../page-editor-types';

export class ItemViewRemovedEvent {

    private view: ItemView;

    constructor(view: ItemView) {
        this.view = view;
    }

    getView(): ItemView {
        return this.view;
    }
}
