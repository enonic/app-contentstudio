import FormItem = api.ui.form.FormItem;
import Validators = api.ui.form.Validators;
import i18n = api.util.i18n;
import TextInput = api.ui.text.TextInput;
import eventInfo = CKEDITOR.eventInfo;
import {CKEBackedDialog} from './CKEBackedDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './ModalDialog';

// With this dialog we hide original cke dialog and replicate all actions from our dialog to original one
export class AnchorModalDialog
    extends CKEBackedDialog {

    private nameField: FormItem;

    constructor(config: eventInfo) {

        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            title: i18n('dialog.anchor.title'),
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });
    }

    protected getMainFormItems(): FormItem[] {
        const formItemBuilder = new ModalDialogFormItemBuilder('name', i18n('dialog.anchor.formitem.name')).setValidator(
            AnchorModalDialog.validationRequiredAnchor);
        this.nameField = this.createFormItem(formItemBuilder);

        this.setFirstFocusField(this.nameField.getInput());

        return [this.nameField];
    }

    private static validationRequiredAnchor(input: api.dom.FormInputEl): string {
        return Validators.required(input) || AnchorModalDialog.validAnchor(input);
    }

    private static validAnchor(input: api.dom.FormInputEl): string {
        const regexUrl = /^\w[\w.]*$/;
        const value = input.getValue();
        return !regexUrl.test(value) ? i18n('field.value.invalid') : undefined;
    }

    protected setDialogInputValues() {
        this.nameField.getInput().getEl().setValue(<string>this.ckeOriginalDialog.getValueOf('info', 'txtName'));
    }

    protected initializeActions() {
        const submitAction = new api.ui.Action(i18n('action.insert'));
        this.setSubmitAction(submitAction);

        this.addAction(submitAction.onExecuted(() => {
            if (this.validate()) {
                this.ckeOriginalDialog.setValueOf('info', 'txtName', this.nameField.getInput().getEl().getValue());
                this.ckeOriginalDialog.getButton('ok').click();
                this.close();
            }
        }));

        super.initializeActions();
    }

    isDirty(): boolean {
        return (<TextInput>this.nameField.getInput()).isDirty();
    }
}
