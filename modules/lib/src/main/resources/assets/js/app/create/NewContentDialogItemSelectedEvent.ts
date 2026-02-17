import {type NewContentDialogListItem} from './NewContentDialogListItem';

export class NewContentDialogItemSelectedEvent {

    private item: NewContentDialogListItem;

    constructor(item: NewContentDialogListItem) {
        this.item = item;
    }

    getItem(): NewContentDialogListItem {
        return this.item;
    }
}
