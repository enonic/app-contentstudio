import {type FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {OverrideNativeDialog} from './OverrideNativeDialog';
import {type HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './ModalDialog';
import {type FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import eventInfo = CKEDITOR.eventInfo;

// With this dialog we hide original cke dialog and replicate all actions from our dialog to original one
export class AnchorModalDialog
    extends OverrideNativeDialog {

    private nameField: FormItem;

    constructor(config: eventInfo) {

        super({
            editor: config.editor,
            dialog: config.data,
            title: i18n('dialog.anchor.title'),
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        } as HtmlAreaModalDialogConfig);
    }

    protected initElements() {
        super.initElements();

        this.setSubmitAction(new Action(i18n('action.insert')));
    }

    protected initListeners() {
        super.initListeners();

        this.submitAction.onExecuted(() => {
            if (this.validate()) {
                this.ckeOriginalDialog.setValueOf('info', 'txtName', this.nameField.getInput().getEl().getValue());
                this.ckeOriginalDialog.getButton('ok').click();
                this.close();
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addAction(this.submitAction);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    protected getMainFormItems(): FormItem[] {
        const formItemBuilder = new ModalDialogFormItemBuilder('name', i18n('dialog.anchor.formitem.name')).setValidator(
            AnchorModalDialog.validationRequiredAnchor);
        this.nameField = this.createFormItem(formItemBuilder);

        this.setElementToFocusOnShow(this.nameField.getInput());

        return [this.nameField];
    }

    private static validationRequiredAnchor(input: FormInputEl): string {
        return Validators.required(input) || AnchorModalDialog.validAnchor(input);
    }

    private static validAnchor(input: FormInputEl): string {
        const regexUrl = /^\w[\w.]*$/;
        const value = input.getValue();
        return !regexUrl.test(value) ? i18n('field.value.invalid') : undefined;
    }

    protected setDialogInputValues() {
        this.nameField.getInput().getEl().setValue(this.ckeOriginalDialog.getValueOf('info', 'txtName') as string);
    }

    isDirty(): boolean {
        return (this.nameField.getInput() as TextInput).isDirty();
    }
}
