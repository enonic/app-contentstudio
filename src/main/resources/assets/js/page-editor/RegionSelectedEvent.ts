import './../api.ts';
import {RegionView} from './RegionView';

export class RegionSelectedEvent
    extends api.event.Event {

    private pageItemView: RegionView;

    constructor(regionView: RegionView) {
        super();
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
