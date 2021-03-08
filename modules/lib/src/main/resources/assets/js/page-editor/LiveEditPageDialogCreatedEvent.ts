import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ModalDialog} from 'lib-admin-ui/ui/dialog/ModalDialog';

export class LiveEditPageDialogCreatedEvent
    extends Event {

    private dialog: ModalDialog;

    private config: any;

    constructor(dialog: ModalDialog, config: any) {
        super();
        this.dialog = dialog;
        this.config = config;
    }

    getModalDialog(): ModalDialog {
        return this.dialog;
    }

    getConfig(): any {
        return this.config;
    }

    static on(handler: (event: LiveEditPageDialogCreatedEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: LiveEditPageDialogCreatedEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
