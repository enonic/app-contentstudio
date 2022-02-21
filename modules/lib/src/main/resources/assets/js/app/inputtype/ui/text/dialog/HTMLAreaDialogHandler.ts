import eventInfo = CKEDITOR.eventInfo;
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
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {ContentSummary} from '../../../../content/ContentSummary';
import {NumberedListModalDialog} from './NumberedListModalDialog';
import {BulletedListModalDialog} from './BulletedListModalDialog';

export class HTMLAreaDialogHandler {

    static createAndOpenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        let modalDialog: ModalDialog;

        switch (event.getType()) {
        case HtmlAreaDialogType.ANCHOR:
            modalDialog = this.openAnchorDialog(event.getConfig());
            break;
        case HtmlAreaDialogType.IMAGE:
            modalDialog = this.openImageDialog(event.getConfig(), event.getContent());
            break;
        case HtmlAreaDialogType.LINK:
            modalDialog = this.openLinkDialog(event.getConfig(), event.getContent());
            break;
        case HtmlAreaDialogType.MACRO:
            modalDialog = this.openMacroDialog(event.getConfig(), event.getContent(), event.getApplicationKeys());
            break;
        case HtmlAreaDialogType.SEARCHREPLACE:
            modalDialog = this.openSearchReplaceDialog(event.getConfig());
            break;
        case HtmlAreaDialogType.CODE:
            modalDialog = this.openCodeDialog(event.getConfig());
            break;
        case HtmlAreaDialogType.SPECIALCHAR:
            modalDialog = this.openSpecialCharDialog(event.getConfig());
            break;
        case HtmlAreaDialogType.FULLSCREEN:
            modalDialog = this.openFullscreenDialog(event.getConfig());
            break;
        case HtmlAreaDialogType.TABLE:
            modalDialog = this.openTableDialog(event.getConfig());
            break;
        case HtmlAreaDialogType.NUMBERED_LIST:
            modalDialog = this.openNumberedListDialog(event.getConfig());
            break;
        case HtmlAreaDialogType.BULLETED_LIST:
            modalDialog = this.openBulletedListDialog(event.getConfig());
            break;
        }

        return modalDialog;
    }

    private static openLinkDialog(config: eventInfo, content: ContentSummary): ModalDialog {
        return this.openDialog(new LinkModalDialog(config, content));
    }

    private static openImageDialog(config: eventInfo, content: ContentSummary): ModalDialog {
        return this.openDialog(new ImageModalDialog(config, content));
    }

    private static openAnchorDialog(config: eventInfo): ModalDialog {
        return this.openDialog(new AnchorModalDialog(config));
    }

    private static openMacroDialog(config: any, content: ContentSummary,
                                   applicationKeys: ApplicationKey[]): ModalDialog {
        return this.openDialog(new MacroModalDialog(config, content, applicationKeys));
    }

    private static openCodeDialog(config: eventInfo): ModalDialog {
        return this.openDialog(new CodeDialog(config));
    }

    private static openSearchReplaceDialog(config: eventInfo): ModalDialog {
        return this.openDialog(new FindAndReplaceDialog(config));
    }

    private static openSpecialCharDialog(config: eventInfo): ModalDialog {
        return this.openDialog(new SpecialCharDialog(config));
    }

    private static openFullscreenDialog(config: any): ModalDialog {
        return this.openDialog(new FullscreenDialog(config));
    }

    private static openTableDialog(config: eventInfo): ModalDialog {
        return this.openDialog(new TableDialog(config));
    }

    private static openNumberedListDialog(config: eventInfo): ModalDialog {
        return this.openDialog(new NumberedListModalDialog(config));
    }

    private static openBulletedListDialog(config: eventInfo): ModalDialog {
        return this.openDialog(new BulletedListModalDialog(config));
    }

    private static openDialog(dialog: ModalDialog): ModalDialog {
        dialog.open();
        return dialog;
    }
}
