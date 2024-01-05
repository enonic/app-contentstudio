import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ContextPanelState} from './ContextPanelState';

export class ToggleContextPanelEvent
    extends Event {

    private readonly state: ContextPanelState | undefined;

    constructor(state?: ContextPanelState) {
        super();
        this.state = state;
    }

    getState(): ContextPanelState | undefined {
        return this.state;
    }

    static on(handler: (event: ToggleContextPanelEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ToggleContextPanelEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
