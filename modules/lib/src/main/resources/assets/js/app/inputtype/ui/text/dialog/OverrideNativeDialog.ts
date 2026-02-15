// With this dialog we hide original cke dialog and replicate all actions from our dialog to original one
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {type HtmlAreaModalDialogConfig, ModalDialog} from './ModalDialog';

export abstract class OverrideNativeDialog
    extends ModalDialog {

    protected ckeOriginalDialog: CKEDITOR.dialog;

    protected constructor(config: HtmlAreaModalDialogConfig) {
        super(config);

        this.hideOriginalCKEDialog();
        this.getEditor().focusManager.add(new CKEDITOR.dom.element(this.getHTMLElement()), true);
    }

    protected initElements() {
        super.initElements();

        this.ckeOriginalDialog = this.config.dialog;

        WindowDOM.get().onBeforeUnload(() => this.close());
    }

    protected postInitElements() {
        super.postInitElements();

        this.setDialogInputValues();
    }

    close() {
        super.close();
        this.ckeOriginalDialog.getElement().$.style.display = 'block';
        this.ckeOriginalDialog.hide();
    }

    private hideOriginalCKEDialog() {
        this.ckeOriginalDialog.getElement().$.style.display = 'none';
        (this.ckeOriginalDialog.getElement().$.ownerDocument.getElementsByClassName(
            'cke_dialog_background_cover')[0] as HTMLElement).style.left = '-10000px';
    }

    protected abstract setDialogInputValues();

    protected getElemFromOriginalDialog(pageId: string, elementId: string): CKEDITOR.ui.dialog.uiElement {
        return this.ckeOriginalDialog.getContentElement(pageId, elementId);
    }

    protected isIgnoredElementClicked(element: HTMLElement): boolean {
        // cke started adding cke_dialog_open on the Body element when opening dialogs backed by native cke dialog
        return element.tagName !== 'BODY' && super.isIgnoredElementClicked(element);
    }
}
