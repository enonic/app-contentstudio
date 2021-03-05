import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ItemView} from './ItemView';
import {ClickPosition} from './ClickPosition';
import {SelectedByClickEvent} from './SelectedByClickEvent';

interface ItemViewSelectedEventConfig {
    itemView: ItemView;
    position: ClickPosition;
    newlyCreated?: boolean;
    rightClicked?: boolean;
    restoredSelection?: boolean;
}

export class ItemViewSelectedEvent
    extends SelectedByClickEvent {

    private pageItemView: ItemView;

    private position: ClickPosition;

    private newlyCreated: boolean;

    private restoredSelection: boolean;

    constructor(config: ItemViewSelectedEventConfig) {
        super(config.rightClicked);
        this.pageItemView = config.itemView;
        this.position = config.position;
        this.newlyCreated = config.newlyCreated === undefined ? false : config.newlyCreated;
        this.restoredSelection = config.restoredSelection === undefined ? false : config.restoredSelection;
    }

    getItemView(): ItemView {
        return this.pageItemView;
    }

    getPosition(): ClickPosition {
        return this.position;
    }

    isNewlyCreated(): boolean {
        return this.newlyCreated;
    }

    isRestoredSelection(): boolean {
        return this.restoredSelection;
    }

    static on(handler: (event: ItemViewSelectedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ItemViewSelectedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
