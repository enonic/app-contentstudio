import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ClickPosition} from '../../../ClickPosition';
import {SelectedByClickEvent} from '../../../SelectedByClickEvent';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';

export interface ItemViewSelectedEventConfig {
    path: ComponentPath;
    position: ClickPosition;
    rightClicked?: boolean;
}

export class SelectComponentEvent
    extends SelectedByClickEvent {

    private readonly path: ComponentPath;

    private readonly position: ClickPosition;

    constructor(config: ItemViewSelectedEventConfig) {
        super(config.rightClicked);
        this.path = config.path;
        this.position = config.position;
    }

    getPath(): ComponentPath {
        return this.path;
    }

    getPosition(): ClickPosition {
        return this.position;
    }

    static on(handler: (event: SelectComponentEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SelectComponentEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
