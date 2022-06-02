import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ItemView} from './ItemView';

export class ItemViewDeselectedEvent
    extends Event {

    private itemView: ItemView;

    constructor(itemView: ItemView) {
        super();
        this.itemView = itemView;
    }

    getItemView(): ItemView {
        return this.itemView;
    }

    static on(handler: (event: ItemViewDeselectedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ItemViewDeselectedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
