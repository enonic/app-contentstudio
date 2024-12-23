import {CreateHtmlAreaContentDialogEvent} from '../CreateHtmlAreaContentDialogEvent';
import {CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../CreateHtmlAreaDialogEvent';
import {CreateHtmlAreaMacroDialogEvent} from '../CreateHtmlAreaMacroDialogEvent';
import {FullScreenDialogParams, MacroDialogParams} from '../HtmlEditor';
import {AnchorModalDialog} from './AnchorModalDialog';
import {BulletedListModalDialog} from './BulletedListModalDialog';
import {CodeDialog} from './CodeDialog';
import {FullscreenDialog} from './FullscreenDialog';
import {ImageModalDialog} from './image/ImageModalDialog';
import {LinkModalDialog} from './LinkModalDialog';
import {MacroModalDialog} from './MacroModalDialog';
import {ModalDialog} from './ModalDialog';
import {NumberedListModalDialog} from './NumberedListModalDialog';
import {SpecialCharDialog} from './SpecialCharDialog';
import {TableDialog} from './TableDialog';
import eventInfo = CKEDITOR.eventInfo;

export class HTMLAreaDialogHandler {

    static createAndOpenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        let modalDialog: ModalDialog;

        switch (event.getType()) {
        case HtmlAreaDialogType.ANCHOR:
            modalDialog = HTMLAreaDialogHandler.openAnchorDialog(event);
            break;
        case HtmlAreaDialogType.IMAGE:
            modalDialog = HTMLAreaDialogHandler.openImageDialog(event as CreateHtmlAreaContentDialogEvent);
            break;
        case HtmlAreaDialogType.LINK:
            modalDialog = HTMLAreaDialogHandler.openLinkDialog(event as CreateHtmlAreaContentDialogEvent);
            break;
        case HtmlAreaDialogType.MACRO:
            modalDialog = HTMLAreaDialogHandler.openMacroDialog(event as CreateHtmlAreaMacroDialogEvent);
            break;
        case HtmlAreaDialogType.CODE:
            modalDialog = HTMLAreaDialogHandler.openCodeDialog(event);
            break;
        case HtmlAreaDialogType.SPECIALCHAR:
            modalDialog = HTMLAreaDialogHandler.openSpecialCharDialog(event);
            break;
        case HtmlAreaDialogType.FULLSCREEN:
            modalDialog = HTMLAreaDialogHandler.openFullscreenDialog(event);
            break;
        case HtmlAreaDialogType.TABLE:
            modalDialog = HTMLAreaDialogHandler.openTableDialog(event);
            break;
        case HtmlAreaDialogType.NUMBERED_LIST:
            modalDialog = HTMLAreaDialogHandler.openNumberedListDialog(event);
            break;
        case HtmlAreaDialogType.BULLETED_LIST:
            modalDialog = HTMLAreaDialogHandler.openBulletedListDialog(event);
            break;
        }

        return modalDialog;
    }

    private static openLinkDialog(event: CreateHtmlAreaContentDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(new LinkModalDialog(event.getConfig() as eventInfo, event.getContent(), event.getProject()));
    }

    private static openImageDialog(event: CreateHtmlAreaContentDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(new ImageModalDialog(event.getConfig() as eventInfo, event.getContent(), event.getProject()));
    }

    private static openAnchorDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(new AnchorModalDialog(event.getConfig() as eventInfo));
    }

    private static openMacroDialog(event: CreateHtmlAreaMacroDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(
            new MacroModalDialog(event.getConfig() as MacroDialogParams, event.getContent(), event.getApplicationKeys()));
    }

    private static openCodeDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(new CodeDialog(event.getConfig() as eventInfo));
    }

    private static openSpecialCharDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(new SpecialCharDialog(event.getConfig() as eventInfo));
    }

    private static openFullscreenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(new FullscreenDialog(event.getConfig() as FullScreenDialogParams));
    }

    private static openTableDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(new TableDialog(event.getConfig() as eventInfo));
    }

    private static openNumberedListDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(new NumberedListModalDialog(event.getConfig() as eventInfo));
    }

    private static openBulletedListDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaDialogHandler.openDialog(new BulletedListModalDialog(event.getConfig() as eventInfo));
    }

    private static openDialog(dialog: ModalDialog): ModalDialog {
        dialog.open();
        return dialog;
    }
}
