import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';

export class CloseContentEvent extends Event {

    private panel: Panel;

    private checkCanRemovePanel: boolean;

    constructor(panel: Panel, checkCanRemovePanel: boolean = true) {
        super();
        this.panel = panel;
        this.checkCanRemovePanel = checkCanRemovePanel;
    }

    getPanel(): Panel {
        return this.panel;
    }

    isCheckCanRemovePanel() {
        return this.checkCanRemovePanel;
    }

    static on(handler: (event: CloseContentEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: CloseContentEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
