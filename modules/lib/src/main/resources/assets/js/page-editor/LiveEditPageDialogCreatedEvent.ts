import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {HtmlAreaDialogConfig} from '../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';

export type LiveEditPageDialogCreatedEventHandler = (event: LiveEditPageDialogCreatedEvent) => void;

export class LiveEditPageDialogCreatedEvent
    extends Event {

    private readonly dialog: ModalDialog;

    private readonly config: HtmlAreaDialogConfig;

    constructor(dialog: ModalDialog, config: HtmlAreaDialogConfig) {
        super();
        this.dialog = dialog;
        this.config = config;
    }

    getModalDialog(): ModalDialog {
        return this.dialog;
    }

    getConfig(): HtmlAreaDialogConfig {
        return this.config;
    }

    static on(handler: LiveEditPageDialogCreatedEventHandler, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: LiveEditPageDialogCreatedEventHandler, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
