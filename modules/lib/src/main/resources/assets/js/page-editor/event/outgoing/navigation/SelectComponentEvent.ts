import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ItemView} from '../../../ItemView';
import {ClickPosition} from '../../../ClickPosition';
import {SelectedByClickEvent} from '../../../SelectedByClickEvent';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export interface ItemViewSelectedEventConfig {
    itemView: ItemView;
    position: ClickPosition;
    newlyCreated?: boolean;
    rightClicked?: boolean;
    restoredSelection?: boolean;
    avoidInspectComponentRefresh?: boolean;
}

export class SelectComponentEvent
    extends SelectedByClickEvent {

    private readonly pageItemView: ItemView;

    private readonly position: ClickPosition;

    private readonly newlyCreated: boolean;

    private readonly restoredSelection: boolean;

    private readonly avoidInspectComponentRefresh: boolean;

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

    getPath(): ComponentPath {
        return this.pageItemView.getPath();
    }

    getComponentPathAsString(): string {
        return this.pageItemView.getPath().toString();
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

    static on(handler: (event: SelectComponentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SelectComponentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
