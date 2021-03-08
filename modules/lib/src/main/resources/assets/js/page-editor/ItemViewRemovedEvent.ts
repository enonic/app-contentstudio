import {ItemView} from './ItemView';

export class ItemViewRemovedEvent {

    private view: ItemView;

    constructor(view: ItemView) {
        this.view = view;
    }

    getView(): ItemView {
        return this.view;
    }
}
