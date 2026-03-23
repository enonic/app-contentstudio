import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../CreateHtmlAreaDialogEvent';
import {type CreateHtmlAreaMacroDialogEvent} from '../CreateHtmlAreaMacroDialogEvent';
import {
    type AnchorDialogParams,
    type CodeDialogParams,
    type FullScreenDialogParams,
    type MacroDialogParams,
    type SpecialCharDialogParams,
    type TableQuicktablePopupParams,
} from '../HtmlEditorTypes';
import {BulletedListModalDialog} from './BulletedListModalDialog';
import {FullscreenDialog} from './FullscreenDialog';
import {MacroModalDialog} from './MacroModalDialog';
import {type ModalDialog} from './ModalDialog';
import {NumberedListModalDialog} from './NumberedListModalDialog';
import {openAnchorDialog as openV6AnchorDialog} from '../../../../../v6/features/store/dialogs/anchorDialog.store';
import {openCodeDialog as openV6CodeDialog} from '../../../../../v6/features/store/dialogs/codeDialog.store';
import {openSpecialCharDialog as openV6SpecialCharDialog} from '../../../../../v6/features/store/dialogs/specialCharDialog.store';
import {openTableDialog as openV6TableDialog} from '../../../../../v6/features/store/dialogs/tableDialog.store';
import {openTableQuicktablePopup as openV6TableQuicktablePopup} from '../../../../../v6/features/store/dialogs/tableQuicktablePopup.store';
import eventInfo = CKEDITOR.eventInfo;

export class HTMLAreaProxy {

    static openDialog(event: CreateHtmlAreaDialogEvent): void {
        switch (event.getType()) {
        case HtmlAreaDialogType.ANCHOR:
            HTMLAreaProxy.openAnchorDialog(event);
            return;
        case HtmlAreaDialogType.MACRO:
            HTMLAreaProxy.openMacroDialog(event as CreateHtmlAreaMacroDialogEvent);
            return;
        case HtmlAreaDialogType.CODE:
            HTMLAreaProxy.openCodeDialog(event);
            return;
        case HtmlAreaDialogType.SPECIALCHAR:
            HTMLAreaProxy.openSpecialCharDialog(event);
            return;
        case HtmlAreaDialogType.FULLSCREEN:
            HTMLAreaProxy.openFullscreenDialog(event);
            return;
        case HtmlAreaDialogType.TABLE_QUICKTABLE:
            HTMLAreaProxy.openTableQuicktablePopup(event);
            return;
        case HtmlAreaDialogType.TABLE:
            HTMLAreaProxy.openTableDialog(event);
            return;
        case HtmlAreaDialogType.NUMBERED_LIST:
            HTMLAreaProxy.openNumberedListDialog(event);
            return;
        case HtmlAreaDialogType.BULLETED_LIST:
            HTMLAreaProxy.openBulletedListDialog(event);
            return;
        }
    }

    private static openAnchorDialog(event: CreateHtmlAreaDialogEvent): void {
        openV6AnchorDialog(event.getConfig() as AnchorDialogParams);
    }

    private static openMacroDialog(event: CreateHtmlAreaMacroDialogEvent): void {
        HTMLAreaProxy.openLegacyDialog(
            new MacroModalDialog(event.getConfig() as MacroDialogParams, event.getContent(), event.getApplicationKeys()));
    }

    private static openCodeDialog(event: CreateHtmlAreaDialogEvent): void {
        openV6CodeDialog(event.getConfig() as CodeDialogParams);
    }

    private static openSpecialCharDialog(event: CreateHtmlAreaDialogEvent): void {
        openV6SpecialCharDialog((event.getConfig() as SpecialCharDialogParams).editor);
    }

    private static openFullscreenDialog(event: CreateHtmlAreaDialogEvent): void {
        HTMLAreaProxy.openLegacyDialog(new FullscreenDialog(event.getConfig() as FullScreenDialogParams));
    }

    private static openTableDialog(event: CreateHtmlAreaDialogEvent): void {
        openV6TableDialog(event.getConfig() as eventInfo);
    }

    private static openTableQuicktablePopup(event: CreateHtmlAreaDialogEvent): void {
        openV6TableQuicktablePopup(event.getConfig() as TableQuicktablePopupParams);
    }

    private static openNumberedListDialog(event: CreateHtmlAreaDialogEvent): void {
        HTMLAreaProxy.openLegacyDialog(new NumberedListModalDialog(event.getConfig() as eventInfo));
    }

    private static openBulletedListDialog(event: CreateHtmlAreaDialogEvent): void {
        HTMLAreaProxy.openLegacyDialog(new BulletedListModalDialog(event.getConfig() as eventInfo));
    }

    private static openLegacyDialog(dialog: ModalDialog): void {
        dialog.open();
    }
}
