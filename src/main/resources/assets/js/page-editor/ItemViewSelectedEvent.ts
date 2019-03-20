import {ItemView} from './ItemView';
import {ClickPosition} from './ClickPosition';

interface ItemViewSelectedEventConfig {
    itemView: ItemView;
    position: ClickPosition;
    isNew?: boolean;
    rightClicked?: boolean;
    restoredSelection?: boolean;
}

export class ItemViewSelectedEvent
    extends api.event.Event {

    private pageItemView: ItemView;

    private position: ClickPosition;

    private newlyCreated: boolean;

    private rightClicked: boolean;

    private restoredSelection: boolean;

    constructor(config: ItemViewSelectedEventConfig) {
        super();
        this.pageItemView = config.itemView;
        this.position = config.position;
        this.newlyCreated = config.isNew === undefined ? false : config.isNew;
        this.rightClicked = config.rightClicked === undefined ? false : config.rightClicked;
        this.restoredSelection = config.restoredSelection === undefined ? false : config.restoredSelection;
    }

    getItemView(): ItemView {
        return this.pageItemView;
    }

    getPosition(): ClickPosition {
        return this.position;
    }

    isNew(): boolean {
        return this.newlyCreated;
    }

    isRightClicked(): boolean {
        return this.rightClicked;
    }

    isRestoredSelection(): boolean {
        return this.restoredSelection;
    }

    static on(handler: (event: ItemViewSelectedEvent) => void, contextWindow: Window = window) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ItemViewSelectedEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
