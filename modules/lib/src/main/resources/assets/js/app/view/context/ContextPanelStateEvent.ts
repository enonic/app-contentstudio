import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContextPanelState} from './ContextPanelState';

export class ContextPanelStateEvent
    extends Event {

    private state: ContextPanelState;

    constructor(state: ContextPanelState) {
        super();

        this.state = state;
    }

    getState(): ContextPanelState {
        return this.state;
    }

    static on(handler: (event: ContextPanelStateEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContextPanelStateEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
