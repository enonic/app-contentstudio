import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {RegionView} from './RegionView';
import {SelectedByClickEvent} from './SelectedByClickEvent';

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

    static on(handler: (event: RegionSelectedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: RegionSelectedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
