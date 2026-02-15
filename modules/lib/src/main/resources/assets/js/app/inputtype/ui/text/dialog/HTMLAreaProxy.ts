import {type CreateHtmlAreaContentDialogEvent} from '../CreateHtmlAreaContentDialogEvent';
import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../CreateHtmlAreaDialogEvent';
import {type CreateHtmlAreaMacroDialogEvent} from '../CreateHtmlAreaMacroDialogEvent';
import {type FullScreenDialogParams, type MacroDialogParams} from '../HtmlEditorTypes';
import {AnchorModalDialog} from './AnchorModalDialog';
import {BulletedListModalDialog} from './BulletedListModalDialog';
import {CodeDialog} from './CodeDialog';
import {FullscreenDialog} from './FullscreenDialog';
import {ImageModalDialog} from './image/ImageModalDialog';
import {LinkModalDialog} from './LinkModalDialog';
import {MacroModalDialog} from './MacroModalDialog';
import {type ModalDialog} from './ModalDialog';
import {NumberedListModalDialog} from './NumberedListModalDialog';
import {SpecialCharDialog} from './SpecialCharDialog';
import {TableDialog} from './TableDialog';
import eventInfo = CKEDITOR.eventInfo;

export class HTMLAreaProxy {

    static createAndOpenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        switch (event.getType()) {
        case HtmlAreaDialogType.ANCHOR:
            return HTMLAreaProxy.openAnchorDialog(event);
        case HtmlAreaDialogType.IMAGE:
            return HTMLAreaProxy.openImageDialog(event as CreateHtmlAreaContentDialogEvent);
        case HtmlAreaDialogType.LINK:
            return HTMLAreaProxy.openLinkDialog(event as CreateHtmlAreaContentDialogEvent);
        case HtmlAreaDialogType.MACRO:
            return HTMLAreaProxy.openMacroDialog(event as CreateHtmlAreaMacroDialogEvent);
        case HtmlAreaDialogType.CODE:
            return HTMLAreaProxy.openCodeDialog(event);
        case HtmlAreaDialogType.SPECIALCHAR:
            return HTMLAreaProxy.openSpecialCharDialog(event);
        case HtmlAreaDialogType.FULLSCREEN:
            return HTMLAreaProxy.openFullscreenDialog(event);
        case HtmlAreaDialogType.TABLE:
            return HTMLAreaProxy.openTableDialog(event);
        case HtmlAreaDialogType.NUMBERED_LIST:
            return HTMLAreaProxy.openNumberedListDialog(event);
        case HtmlAreaDialogType.BULLETED_LIST:
            return HTMLAreaProxy.openBulletedListDialog(event);
        }
    }

    private static openLinkDialog(event: CreateHtmlAreaContentDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(new LinkModalDialog(event.getConfig() as eventInfo, event.getContent(), event.getProject()));
    }

    private static openImageDialog(event: CreateHtmlAreaContentDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(new ImageModalDialog(event.getConfig() as eventInfo, event.getContent(), event.getProject()));
    }

    private static openAnchorDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(new AnchorModalDialog(event.getConfig() as eventInfo));
    }

    private static openMacroDialog(event: CreateHtmlAreaMacroDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(
            new MacroModalDialog(event.getConfig() as MacroDialogParams, event.getContent(), event.getApplicationKeys()));
    }

    private static openCodeDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(new CodeDialog(event.getConfig() as eventInfo));
    }

    private static openSpecialCharDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(new SpecialCharDialog(event.getConfig() as eventInfo));
    }

    private static openFullscreenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(new FullscreenDialog(event.getConfig() as FullScreenDialogParams));
    }

    private static openTableDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(new TableDialog(event.getConfig() as eventInfo));
    }

    private static openNumberedListDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(new NumberedListModalDialog(event.getConfig() as eventInfo));
    }

    private static openBulletedListDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        return HTMLAreaProxy.openDialog(new BulletedListModalDialog(event.getConfig() as eventInfo));
    }

    private static openDialog(dialog: ModalDialog): ModalDialog {
        dialog.open();
        return dialog;
    }
}
