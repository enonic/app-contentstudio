import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {FragmentComponentView} from './fragment/FragmentComponentView';

export class FragmentLoadErrorEvent
    extends Event {

    private fragmentComponentView: FragmentComponentView;

    constructor(fragmentComponentView: FragmentComponentView) {
        super();
        this.fragmentComponentView = fragmentComponentView;
    }

    getFragmentComponentView(): FragmentComponentView {
        return this.fragmentComponentView;
    }

    static on(handler: (event: FragmentLoadErrorEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: FragmentLoadErrorEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
