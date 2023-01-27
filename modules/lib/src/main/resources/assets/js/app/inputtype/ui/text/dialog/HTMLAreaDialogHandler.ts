import {ModalDialog} from './ModalDialog';
import {CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../CreateHtmlAreaDialogEvent';
import {LinkModalDialog} from './LinkModalDialog';
import {ImageModalDialog} from './image/ImageModalDialog';
import {AnchorModalDialog} from './AnchorModalDialog';
import {MacroModalDialog} from './MacroModalDialog';
import {CodeDialog} from './CodeDialog';
import {FindAndReplaceDialog} from './FindAndReplaceDialog';
import {SpecialCharDialog} from './SpecialCharDialog';
import {FullscreenDialog} from './FullscreenDialog';
import {TableDialog} from './TableDialog';
import {NumberedListModalDialog} from './NumberedListModalDialog';
import {BulletedListModalDialog} from './BulletedListModalDialog';
import {CreateHtmlAreaContentDialogEvent} from '../CreateHtmlAreaContentDialogEvent';
import {CreateHtmlAreaMacroDialogEvent} from '../CreateHtmlAreaMacroDialogEvent';
import {FullScreenDialogParams, MacroDialogParams} from '../HtmlEditor';
import eventInfo = CKEDITOR.eventInfo;

export class HTMLAreaDialogHandler {

    static createAndOpenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        let modalDialog: ModalDialog;

        switch (event.getType()) {
        case HtmlAreaDialogType.ANCHOR:
            modalDialog = this.openAnchorDialog(event);
            break;
        case HtmlAreaDialogType.IMAGE:
            modalDialog = this.openImageDialog(event as CreateHtmlAreaContentDialogEvent);
            break;
        case HtmlAreaDialogType.LINK:
            modalDialog = this.openLinkDialog(event as CreateHtmlAreaContentDialogEvent);
            break;
        case HtmlAreaDialogType.MACRO:
            modalDialog = this.openMacroDialog(event as CreateHtmlAreaMacroDialogEvent);
            break;
        case HtmlAreaDialogType.SEARCHREPLACE:
            modalDialog = this.openSearchReplaceDialog(event);
            break;
        case HtmlAreaDialogType.CODE:
            modalDialog = this.openCodeDialog(event);
            break;
        case HtmlAreaDialogType.SPECIALCHAR:
            modalDialog = this.openSpecialCharDialog(event);
            break;
        case HtmlAreaDialogType.FULLSCREEN:
            modalDialog = this.openFullscreenDialog(event);
            break;
        case HtmlAreaDialogType.TABLE:
            modalDialog = this.openTableDialog(event);
            break;
        case HtmlAreaDialogType.NUMBERED_LIST:
            modalDialog = this.openNumberedListDialog(event);
            break;
        case HtmlAreaDialogType.BULLETED_LIST:
            modalDialog = this.openBulletedListDialog(event);
            break;
        }

        return modalDialog;
    }

    private static openLinkDialog(event: CreateHtmlAreaContentDialogEvent): ModalDialog {
        return this.openDialog(new LinkModalDialog(event.getConfig() as eventInfo, event.getContent(), event.getProject()));
    }

    private static openImageDialog(event: CreateHtmlAreaContentDialogEvent): ModalDialog {
        return this.openDialog(new ImageModalDialog(event.getConfig() as eventInfo, event.getContent(), event.getProject()));
    }

    private static openAnchorDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return this.openDialog(new AnchorModalDialog(event.getConfig() as eventInfo));
    }

    private static openMacroDialog(event: CreateHtmlAreaMacroDialogEvent): ModalDialog {
        return this.openDialog(
            new MacroModalDialog(event.getConfig() as MacroDialogParams, event.getContent(), event.getApplicationKeys()));
    }

    private static openCodeDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return this.openDialog(new CodeDialog(event.getConfig() as eventInfo));
    }

    private static openSearchReplaceDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return this.openDialog(new FindAndReplaceDialog(event.getConfig() as eventInfo));
    }

    private static openSpecialCharDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return this.openDialog(new SpecialCharDialog(event.getConfig() as eventInfo));
    }

    private static openFullscreenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return this.openDialog(new FullscreenDialog(event.getConfig() as FullScreenDialogParams));
    }

    private static openTableDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return this.openDialog(new TableDialog(event.getConfig() as eventInfo));
    }

    private static openNumberedListDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return this.openDialog(new NumberedListModalDialog(event.getConfig() as eventInfo));
    }

    private static openBulletedListDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return this.openDialog(new BulletedListModalDialog(event.getConfig() as eventInfo));
    }

    private static openDialog(dialog: ModalDialog): ModalDialog {
        dialog.open();
        return dialog;
    }
}
