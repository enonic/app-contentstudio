import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../CreateHtmlAreaDialogEvent';
import {type CreateHtmlAreaMacroDialogEvent} from '../CreateHtmlAreaMacroDialogEvent';
import {type MacroDialogParams} from '../HtmlEditorTypes';
import {MacroModalDialog} from './MacroModalDialog';
import {type ModalDialog} from './ModalDialog';

export class HTMLAreaProxy {

    static openDialog(event: CreateHtmlAreaDialogEvent): void {
        switch (event.getType()) {
        case HtmlAreaDialogType.MACRO:
            HTMLAreaProxy.openMacroDialog(event as CreateHtmlAreaMacroDialogEvent);
            return;
        }
    }

    private static openMacroDialog(event: CreateHtmlAreaMacroDialogEvent): void {
        HTMLAreaProxy.openLegacyDialog(
            new MacroModalDialog(event.getConfig() as MacroDialogParams, event.getContent(), event.getApplicationKeys()));
    }

    private static openLegacyDialog(dialog: ModalDialog): void {
        dialog.open();
    }
}
