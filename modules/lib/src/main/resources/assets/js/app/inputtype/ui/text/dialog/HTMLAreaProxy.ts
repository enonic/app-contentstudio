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

export class HTMLAreaProxy {

    static createAndOpenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        switch (event.getType()) {
        case HtmlAreaDialogType.ANCHOR:
            return this.openAnchorDialog(event);
        case HtmlAreaDialogType.IMAGE:
            return this.openImageDialog(event as CreateHtmlAreaContentDialogEvent);
        case HtmlAreaDialogType.LINK:
            return this.openLinkDialog(event as CreateHtmlAreaContentDialogEvent);
        case HtmlAreaDialogType.MACRO:
            return this.openMacroDialog(event as CreateHtmlAreaMacroDialogEvent);
        case HtmlAreaDialogType.CODE:
            return this.openCodeDialog(event);
        case HtmlAreaDialogType.SPECIALCHAR:
            return this.openSpecialCharDialog(event);
        case HtmlAreaDialogType.FULLSCREEN:
            return this.openFullscreenDialog(event);
        case HtmlAreaDialogType.TABLE:
            return this.openTableDialog(event);
        case HtmlAreaDialogType.NUMBERED_LIST:
            return this.openNumberedListDialog(event);
        case HtmlAreaDialogType.BULLETED_LIST:
            return this.openBulletedListDialog(event);
        }
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
