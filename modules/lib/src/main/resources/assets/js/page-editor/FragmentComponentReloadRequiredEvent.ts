import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {FragmentComponentView} from './fragment/FragmentComponentView';

export class FragmentComponentReloadRequiredEvent
    extends IframeEvent {

    private fragmentComponentView: FragmentComponentView;

    constructor(fragmentComponentView: FragmentComponentView) {
        super();
        this.fragmentComponentView = fragmentComponentView;
    }

    getFragmentComponentView(): FragmentComponentView {
        return this.fragmentComponentView;
    }

    static on(handler: (event: FragmentComponentReloadRequiredEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: FragmentComponentReloadRequiredEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
