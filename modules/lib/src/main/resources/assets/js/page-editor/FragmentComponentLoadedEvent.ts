import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {FragmentComponentView} from './fragment/FragmentComponentView';

export class FragmentComponentLoadedEvent
    extends Event {

    private fragmentComponentView: FragmentComponentView;

    constructor(fragmentComponentView: FragmentComponentView) {
        super();
        this.fragmentComponentView = fragmentComponentView;
    }

    getFragmentComponentView(): FragmentComponentView {
        return this.fragmentComponentView;
    }

    static on(handler: (event: FragmentComponentLoadedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: FragmentComponentLoadedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
