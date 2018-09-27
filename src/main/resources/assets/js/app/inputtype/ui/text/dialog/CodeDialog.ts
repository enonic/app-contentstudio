import TextArea = api.ui.text.TextArea;
import i18n = api.util.i18n;
import eventInfo = CKEDITOR.eventInfo;
import {OverrideNativeDialog} from './OverrideNativeDialog';
import {HtmlAreaModalDialogConfig} from './ModalDialog';

export class CodeDialog
    extends OverrideNativeDialog {

    private textArea: TextArea;

    constructor(config: eventInfo) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            title: i18n('dialog.sourcecode.title'), cls: 'source-code-modal-dialog',
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });

    }

    protected setDialogInputValues() {
        this.textArea.setValue(<string>this.ckeOriginalDialog.getValueOf('main', 'data'));
    }

    protected layout() {
        super.layout();

        this.textArea = new TextArea('source-textarea');
        this.appendChildToContentPanel(this.textArea);
        this.setFirstFocusField(this.textArea);
    }

    protected initializeActions() {
        const submitAction = new api.ui.Action(i18n('action.ok'));
        this.setSubmitAction(submitAction);

        this.addAction(submitAction.onExecuted(() => {
            this.ckeOriginalDialog.setValueOf('main', 'data', this.textArea.getValue());
            this.ckeOriginalDialog.getButton('ok').click();
            this.close();
        }));

        super.initializeActions();
    }

    isDirty(): boolean {
        return this.textArea.isDirty();
    }
}
