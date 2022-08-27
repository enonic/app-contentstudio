import {IDentifiable} from '@enonic/lib-admin-ui/IDentifiable';
import {ItemView} from './ItemView';

export class ItemViewTreeGridWrapper implements IDentifiable {

    private readonly itemView: ItemView;

    private displayName: string;

    constructor(itemView: ItemView) {
        this.itemView = itemView;
    }

    getItemView(): ItemView {
        return this.itemView;
    }

    setDisplayName(value: string): void {
        this.displayName = value;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getId(): string {
        return this.itemView.getItemId().toString();
    }

}
