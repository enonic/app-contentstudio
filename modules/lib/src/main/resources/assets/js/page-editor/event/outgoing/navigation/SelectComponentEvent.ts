import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ItemView} from '../../../ItemView';
import {ClickPosition} from '../../../ClickPosition';
import {SelectedByClickEvent} from '../../../SelectedByClickEvent';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export interface ItemViewSelectedEventConfig {
    itemView: ItemView;
    position: ClickPosition;
    rightClicked?: boolean;
}

export class SelectComponentEvent
    extends SelectedByClickEvent {

    private readonly pageItemView: ItemView;

    private readonly position: ClickPosition;

    constructor(config: ItemViewSelectedEventConfig) {
        super(config.rightClicked);
        this.pageItemView = config.itemView;
        this.position = config.position;
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

    static on(handler: (event: SelectComponentEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SelectComponentEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
