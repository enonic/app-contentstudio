import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ItemView} from './ItemView';
import {ClickPosition} from './ClickPosition';
import {SelectedByClickEvent} from './SelectedByClickEvent';

export interface ItemViewSelectedEventConfig {
    itemView: ItemView;
    position: ClickPosition;
    newlyCreated?: boolean;
    rightClicked?: boolean;
    restoredSelection?: boolean;
    avoidInspectComponentRefresh?: boolean;
}

export class ItemViewSelectedEvent
    extends SelectedByClickEvent {

    private pageItemView: ItemView;

    private position: ClickPosition;

    private newlyCreated: boolean;

    private restoredSelection: boolean;

    private avoidInspectComponentRefresh: boolean;

    constructor(config: ItemViewSelectedEventConfig) {
        super(config.rightClicked);
        this.pageItemView = config.itemView;
        this.position = config.position;
        this.newlyCreated = config.newlyCreated === undefined ? false : config.newlyCreated;
        this.restoredSelection = config.restoredSelection === undefined ? false : config.restoredSelection;
        this.avoidInspectComponentRefresh = config.avoidInspectComponentRefresh === undefined ? false : config.avoidInspectComponentRefresh;
    }

    getItemView(): ItemView {
        return this.pageItemView;
    }

    getPosition(): ClickPosition {
        return this.position;
    }

    shouldAvoidInspectComponentRefresh(): boolean {
        return this.avoidInspectComponentRefresh;
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
