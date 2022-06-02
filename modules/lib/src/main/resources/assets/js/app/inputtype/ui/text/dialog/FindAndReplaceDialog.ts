import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {TextInput} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Checkbox, InputAlignment} from '@enonic/lib-admin-ui/ui/Checkbox';
import {OverrideNativeDialog} from './OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './ModalDialog';
import eventInfo = CKEDITOR.eventInfo;
import button = CKEDITOR.ui.dialog.button;

// With this dialog we hide original cke dialog and replicate all actions from our dialog to original one
export class FindAndReplaceDialog
    extends OverrideNativeDialog {

    private findInput: TextInput;
    private replaceInput: TextInput;
    private matchCaseCheckbox: Checkbox;
    private wholeWordsCheckbox: Checkbox;
    private matchCyclicCheckbox: Checkbox;

    private replaceAction: Action;
    private replaceAllAction: Action;
    private findAction: Action;

    constructor(config: eventInfo) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            title: i18n('dialog.search.title'),
            class: 'search-and-replace-modal-dialog search-and-replace-modal-dialog-cke'
        });
    }

    protected initElements() {
        super.initElements();

        this.findAction = new Action(i18n('dialog.search.find'));
        this.replaceAction = new Action(i18n('action.replace'));
        this.replaceAllAction = new Action(i18n('action.replaceall'));
        this.setSubmitAction(this.findAction);
    }

    protected initListeners() {
        super.initListeners();

        this.findAction.onExecuted(() => {
            this.getElementFromOriginalDialog('find', 'txtFindFind').setValue(this.findInput.getValue(), false);
            this.setCheckboxesValuesToOriginalDialogFind();
            (<button>this.getElementFromOriginalDialog('find', 'btnFind')).click();
        });

        this.replaceAction.onExecuted(() => {
            this.getElementFromOriginalDialog('replace', 'txtFindReplace').setValue(this.findInput.getValue(), false);
            this.getElementFromOriginalDialog('replace', 'txtReplace').setValue(this.replaceInput.getValue(), false);
            this.setCheckboxesValuesToOriginalDialogReplace();
            (<button>this.getElementFromOriginalDialog('replace', 'btnFindReplace')).click();
        });

        this.replaceAllAction.onExecuted(() => {
            this.getElementFromOriginalDialog('replace', 'txtFindReplace').setValue(this.findInput.getValue(), false);
            this.getElementFromOriginalDialog('replace', 'txtReplace').setValue(this.replaceInput.getValue(), false);
            this.setCheckboxesValuesToOriginalDialogReplace();
            (<button>this.getElementFromOriginalDialog('replace', 'btnReplaceAll')).click();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addAction(this.findAction);
            this.addAction(this.replaceAction);
            this.addAction(this.replaceAllAction);

            return rendered;
        });
    }

    protected getMainFormItems(): FormItem[] {
        const findField = this.createFormItem(new ModalDialogFormItemBuilder('find', i18n('dialog.search.find')));
        const replaceField = this.createFormItem(new ModalDialogFormItemBuilder('replace', i18n('dialog.search.replace')));
        const matchCaseCheckbox = this.createCheckbox('matchcase', i18n('dialog.search.matchcase'));
        const wholeWordsCheckbox = this.createCheckbox('wholewords', i18n('dialog.search.wholewords'));
        const matchCyclicCheckbox = this.createCheckbox('matchcyclic', i18n('dialog.search.matchcyclic'), true);

        this.findInput = <TextInput>findField.getInput();
        this.replaceInput = <TextInput>replaceField.getInput();
        this.matchCaseCheckbox = <Checkbox>matchCaseCheckbox.getInput();
        this.wholeWordsCheckbox = <Checkbox>wholeWordsCheckbox.getInput();
        this.matchCyclicCheckbox = <Checkbox>matchCyclicCheckbox.getInput();

        this.setElementToFocusOnShow(findField.getInput());

        return [
            findField,
            replaceField,
            matchCaseCheckbox,
            wholeWordsCheckbox,
            matchCyclicCheckbox
        ];
    }

    private createCheckbox(id: string, label: string, checked?: boolean): FormItem {
        const checkbox: Checkbox = Checkbox.create().setLabelText(label).setChecked(checked).setInputAlignment(
            InputAlignment.LEFT).build();

        checkbox.onValueChanged(() => {
            this.findAction.execute();
        });

        const formItemBuilder = new ModalDialogFormItemBuilder(id).setInputEl(checkbox);

        return this.createFormItem(formItemBuilder);
    }

    protected setDialogInputValues() {
        //
    }

    private getElementFromOriginalDialog(pageId: string, elementId: string) {
        return this.ckeOriginalDialog.getContentElement(pageId, elementId);
    }

    private setCheckboxesValuesToOriginalDialogFind() {
        this.ckeOriginalDialog.getContentElement('find', 'txtFindCaseChk').setValue(this.matchCaseCheckbox.isChecked(), false);
        this.ckeOriginalDialog.getContentElement('find', 'txtFindWordChk').setValue(this.wholeWordsCheckbox.isChecked(), false);
        this.ckeOriginalDialog.getContentElement('find', 'txtFindCyclic').setValue(this.matchCyclicCheckbox.isChecked(), false);
    }

    private setCheckboxesValuesToOriginalDialogReplace() {
        this.ckeOriginalDialog.getContentElement('replace', 'txtReplaceCaseChk').setValue(this.matchCaseCheckbox.isChecked(), false);
        this.ckeOriginalDialog.getContentElement('replace', 'txtReplaceWordChk').setValue(this.wholeWordsCheckbox.isChecked(), false);
        this.ckeOriginalDialog.getContentElement('replace', 'txtReplaceCyclic').setValue(this.matchCyclicCheckbox.isChecked(), false);
    }
}
