import eventInfo = CKEDITOR.eventInfo;
import {ModalDialog} from './ModalDialog';
import {CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../CreateHtmlAreaDialogEvent';
import {LinkModalDialog} from './LinkModalDialog';
import {ImageModalDialog} from './ImageModalDialog';
import {AnchorModalDialog} from './AnchorModalDialog';
import {MacroModalDialog} from './MacroModalDialog';
import {CodeDialog} from './CodeDialog';
import {FindAndReplaceDialog} from './FindAndReplaceDialog';
import {SpecialCharDialog} from './SpecialCharDialog';
import {FullscreenDialog} from './FullscreenDialog';

export class HTMLAreaDialogHandler {

    private static modalDialog: ModalDialog;

    static createAndOpenDialog(event: CreateHtmlAreaDialogEvent): ModalDialog {
        let modalDialog;

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
        }

        if (modalDialog) {
            this.modalDialog = modalDialog;
            modalDialog.onHidden(() => {
                this.modalDialog = null;
            });
        }

        return this.modalDialog;
    }

    static getOpenDialog(): ModalDialog {
        return this.modalDialog;
    }

    private static openLinkDialog(config: eventInfo, content: api.content.ContentSummary): ModalDialog {
        return this.openDialog(new LinkModalDialog(config, content));
    }

    private static openImageDialog(config: eventInfo, content: api.content.ContentSummary): ModalDialog {
        return this.openDialog(new ImageModalDialog(config, content));
    }

    private static openAnchorDialog(config: eventInfo): ModalDialog {
        return this.openDialog(new AnchorModalDialog(config));
    }

    private static openMacroDialog(config: any, content: api.content.ContentSummary,
                                   applicationKeys: api.application.ApplicationKey[]): ModalDialog {
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

    private static openFullscreenDialog(config: eventInfo): ModalDialog {
        const fullscreenDialog = new FullscreenDialog(config);

        const createHtmlAreaDialogHandler = () => {
            if (HTMLAreaDialogHandler.getOpenDialog() === fullscreenDialog) {
                return;
            }
            fullscreenDialog.addClass('masked');

            HTMLAreaDialogHandler.getOpenDialog().onRemoved(() => {
                fullscreenDialog.removeClass('masked');
            });
        };

        CreateHtmlAreaDialogEvent.on(createHtmlAreaDialogHandler);

        fullscreenDialog.onRemoved(() => {
            CreateHtmlAreaDialogEvent.un(createHtmlAreaDialogHandler);
        });

        return this.openDialog(fullscreenDialog);
    }

    private static openDialog(dialog: ModalDialog): ModalDialog {
        dialog.open();
        return dialog;
    }
}
