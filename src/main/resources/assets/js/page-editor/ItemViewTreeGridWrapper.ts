import {IDentifiable} from 'lib-admin-ui/IDentifiable';
import {ItemView} from './ItemView';

export class ItemViewTreeGridWrapper implements IDentifiable {

    private readonly itemView: ItemView;

    constructor(itemView: ItemView) {
        this.itemView = itemView;
    }

    getItemView(): ItemView {
        return this.itemView;
    }

    getId(): string {
        return this.itemView.getItemId().toString();
    }

}
