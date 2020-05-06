import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {OverrideNativeDialog} from './OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './ModalDialog';
import {FormItem} from 'lib-admin-ui/ui/form/FormItem';
import {NumberHelper} from 'lib-admin-ui/util/NumberHelper';
import {Dropdown, DropdownConfig} from 'lib-admin-ui/ui/selector/dropdown/Dropdown';
import {FormInputEl} from 'lib-admin-ui/dom/FormInputEl';
import {Action} from 'lib-admin-ui/ui/Action';
import eventInfo = CKEDITOR.eventInfo;

enum DialogType {
    TABLE, TABLEPROPERTIES
}

export interface TableModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    dialogType: DialogType;
}

export class TableDialog
    extends OverrideNativeDialog {

    private rowsField: FormItem;

    private colsField: FormItem;

    private headersField: FormItem;

    private alignmentField: FormItem;

    private captionField: FormItem;

    private dialogType: DialogType;

    protected config: TableModalDialogConfig;

    constructor(config: eventInfo) {

        super(<TableModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            class: 'table-modal-dialog',
            title: i18n('dialog.table.title'),
            dialogType: config.data.getName() === 'table' ? DialogType.TABLE : DialogType.TABLEPROPERTIES,
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });
    }

    protected initElements() {
        super.initElements();

        this.dialogType = this.config.dialogType;
        this.setSubmitAction(new Action(i18n('action.ok')));
    }

    protected postInitElements() {
        super.postInitElements();

        if (this.rowsField.getInput().getEl().isDisabled()) {
            this.setElementToFocusOnShow(this.headersField.getInput());
        } else {
            this.setElementToFocusOnShow(this.rowsField.getInput());
        }
    }

    protected initListeners() {
        super.initListeners();

        this.submitAction.onExecuted(() => {
            if (this.validate()) {
                this.updateOriginalDialogInputValues();
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
        this.rowsField =
            this.createFormItem(new ModalDialogFormItemBuilder('rows', i18n('dialog.table.formitem.rows')).setValidator(
                TableDialog.isPositiveWholeNumber));

        this.colsField =
            this.createFormItem(new ModalDialogFormItemBuilder('cols', i18n('dialog.table.formitem.columns')).setValidator(
                TableDialog.isPositiveWholeNumber));

        this.headersField =
            this.createFormItem(
                new ModalDialogFormItemBuilder('headers', i18n('dialog.table.formitem.headers')).setInputEl(this.createHeadersDropdown()));

        this.alignmentField =
            this.createFormItem(
                new ModalDialogFormItemBuilder('alignment', i18n('dialog.table.formitem.alignment')).setInputEl(
                    this.createAlignmentDropdown()));

        this.captionField =
            this.createFormItem(new ModalDialogFormItemBuilder('caption', i18n('dialog.table.formitem.caption')));

        return [
            this.rowsField,
            this.colsField,
            this.headersField,
            this.alignmentField,
            this.captionField
        ];
    }

    private createHeadersDropdown(): Dropdown<string> {
        const headerDropdown: Dropdown<string> = new Dropdown<string>('headers', <DropdownConfig<string>>{});

        headerDropdown.addOption(<Option<string>>{value: '', displayValue: i18n('dialog.table.headers.none')});
        headerDropdown.addOption(<Option<string>>{value: 'row', displayValue: i18n('dialog.table.headers.row')});
        headerDropdown.addOption(<Option<string>>{value: 'col', displayValue: i18n('dialog.table.headers.col')});
        headerDropdown.addOption(<Option<string>>{value: 'both', displayValue: i18n('dialog.table.headers.both')});

        return headerDropdown;
    }

    private createAlignmentDropdown(): Dropdown<string> {
        const alignmentDropdown: Dropdown<string> = new Dropdown<string>('headers', <DropdownConfig<string>>{});

        alignmentDropdown.addOption(<Option<string>>{value: '', displayValue: i18n('dialog.table.alignment.none')});
        alignmentDropdown.addOption(<Option<string>>{value: 'left', displayValue: i18n('dialog.table.alignment.left')});
        alignmentDropdown.addOption(<Option<string>>{value: 'center', displayValue: i18n('dialog.table.alignment.center')});
        alignmentDropdown.addOption(<Option<string>>{value: 'right', displayValue: i18n('dialog.table.alignment.right')});

        return alignmentDropdown;
    }

    protected setDialogInputValues() {
        this.rowsField.getInput().getEl().setValue(this.getOriginalRowsElem().getValue());
        this.rowsField.getInput().getEl().setDisabled(this.dialogType === DialogType.TABLEPROPERTIES);
        this.colsField.getInput().getEl().setValue(this.getOriginalColsElem().getValue());
        this.colsField.getInput().getEl().setDisabled(this.dialogType === DialogType.TABLEPROPERTIES);
        (<Dropdown<string>>this.headersField.getInput()).setValue(this.getOriginalHeadersElem().getValue());
        (<Dropdown<string>>this.alignmentField.getInput()).setValue(this.getOriginalAlignmentElem().getValue());
        this.captionField.getInput().getEl().setValue(this.getOriginalCaptionElem().getValue());
    }

    private updateOriginalDialogInputValues() {
        this.getOriginalRowsElem().setValue(this.rowsField.getInput().getEl().getValue(), false);
        this.getOriginalColsElem().setValue(this.colsField.getInput().getEl().getValue(), false);
        this.getOriginalHeadersElem().setValue((<Dropdown<string>>this.headersField.getInput()).getValue(), false);
        this.getOriginalAlignmentElem().setValue((<Dropdown<string>>this.alignmentField.getInput()).getValue(), false);
        this.getOriginalCaptionElem().setValue(this.captionField.getInput().getEl().getValue(), false);
    }

    private static isPositiveWholeNumber(input: FormInputEl) {
        const valueAsNumber: number = NumberHelper.toNumber(input.getValue());

        if (!NumberHelper.isWholeNumber(valueAsNumber) || !(valueAsNumber > 0)) {
            return i18n('dialog.table.notawholenumber');
        }

        return undefined;
    }

    private static isPositiveNumber(input: FormInputEl) {
        const valueAsNumber: number = NumberHelper.toNumber(input.getValue());

        if (!NumberHelper.isNumber(valueAsNumber) || !(valueAsNumber >= 0)) {
            return i18n('dialog.table.notanumber');
        }

        return undefined;
    }

    private getOriginalRowsElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'txtRows');
    }

    private getOriginalColsElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'txtCols');
    }

    private getOriginalCellSpacingElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'txtCellSpace');
    }

    private getOriginalCellPaddingElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'txtCellPad');
    }

    private getOriginalBorderElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'txtBorder');
    }

    private getOriginalHeadersElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'selHeaders');
    }

    private getOriginalAlignmentElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'cmbAlign');
    }

    private getOriginalCaptionElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'txtCaption');
    }

}
