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
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler: (event: RegionSelectedEvent) => void, contextWindow: Window = window) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler, contextWindow);
    }
}
