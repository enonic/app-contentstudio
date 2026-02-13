import type {ItemView} from '../../page-editor-types';

export class ItemViewAddedEvent {

    private view: ItemView;
    private newlyCreated: boolean;

    constructor(view: ItemView, newlyCreated: boolean = false) {
        this.view = view;
        this.newlyCreated = newlyCreated;
    }

    getView(): ItemView {
        return this.view;
    }

    isNewlyCreated(): boolean {
        return this.newlyCreated;
    }
}
