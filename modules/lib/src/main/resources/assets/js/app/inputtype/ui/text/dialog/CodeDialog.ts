import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {TextArea} from 'lib-admin-ui/ui/text/TextArea';
import {OverrideNativeDialog} from './OverrideNativeDialog';
import {HtmlAreaModalDialogConfig} from './ModalDialog';
import {Action} from 'lib-admin-ui/ui/Action';
import eventInfo = CKEDITOR.eventInfo;

export class CodeDialog
    extends OverrideNativeDialog {

    private textArea: TextArea;

    constructor(config: eventInfo) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            title: i18n('dialog.sourcecode.title'),
            class: 'source-code-modal-dialog',
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });
    }

    protected initElements() {
        super.initElements();

        this.textArea = new TextArea('source-textarea');
        this.setSubmitAction(new Action(i18n('action.ok')));
    }

    protected postInitElements() {
        super.postInitElements();

        this.setElementToFocusOnShow(this.textArea);
    }

    protected initListeners() {
        super.initListeners();

        this.submitAction.onExecuted(() => {
            this.ckeOriginalDialog.setValueOf('main', 'data', this.textArea.getValue());
            this.ckeOriginalDialog.getButton('ok').click();
            this.close();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildToContentPanel(this.textArea);
            this.addAction(this.submitAction);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    protected setDialogInputValues() {
        this.textArea.setValue(<string>this.ckeOriginalDialog.getValueOf('main', 'data'));
    }

    isDirty(): boolean {
        return this.textArea.isDirty();
    }
}
