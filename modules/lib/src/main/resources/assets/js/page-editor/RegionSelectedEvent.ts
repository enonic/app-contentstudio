import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {RegionView} from './RegionView';
import {SelectedByClickEvent} from './SelectedByClickEvent';
import {ComponentPath} from '../app/page/region/ComponentPath';

export class RegionSelectedEvent
    extends SelectedByClickEvent {

    private pageItemView: RegionView;

    constructor(regionView: RegionView, rightClicked?: boolean) {
        super(rightClicked);
        this.pageItemView = regionView;
    }

    getRegionView(): RegionView {
        return this.pageItemView;
    }

    getComponentPath(): ComponentPath {
        return this.pageItemView.getPath();
    }

    static on(handler: (event: RegionSelectedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: RegionSelectedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
