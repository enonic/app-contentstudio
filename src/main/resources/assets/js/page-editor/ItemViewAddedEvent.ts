import './../api.ts';
import {ItemView} from './ItemView';

export class ItemViewAddedEvent {

    private view: ItemView;
    private newlyCreated: boolean;

    constructor(view: ItemView, isNew: boolean = false) {
        this.view = view;
        this.newlyCreated = isNew;
    }

    getView(): ItemView {
        return this.view;
    }

    isNew(): boolean {
        return this.newlyCreated;
    }
}
