import {OverrideNativeDialog} from './OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './ModalDialog';
import eventInfo = CKEDITOR.eventInfo;
import i18n = api.util.i18n;
import FormItem = api.ui.form.FormItem;
import NumberHelper = api.util.NumberHelper;
import Dropdown = api.ui.selector.dropdown.Dropdown;
import DropdownConfig = api.ui.selector.dropdown.DropdownConfig;
import Option = api.ui.selector.Option;

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

    private cellSpacingField: FormItem;

    private cellPaddingField: FormItem;

    private borderField: FormItem;

    private alignmentField: FormItem;

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
        this.setSubmitAction(new api.ui.Action(i18n('action.ok')));
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

        this.cellSpacingField =
            this.createFormItem(new ModalDialogFormItemBuilder('cellspacing', i18n('dialog.table.formitem.cellSpacing')).setValidator(
                TableDialog.isPositiveNumber));

        this.cellPaddingField =
            this.createFormItem(new ModalDialogFormItemBuilder('cellpadding', i18n('dialog.table.formitem.cellPadding')).setValidator(
                TableDialog.isPositiveNumber));

        this.borderField =
            this.createFormItem(new ModalDialogFormItemBuilder('border', i18n('dialog.table.formitem.border')).setValidator(
                TableDialog.isPositiveNumber));

        this.alignmentField =
            this.createFormItem(
                new ModalDialogFormItemBuilder('alignment', i18n('dialog.table.formitem.alignment')).setInputEl(
                    this.createAlignmentDropdown()));

        return [
            this.rowsField,
            this.colsField,
            this.headersField,
            this.cellSpacingField,
            this.cellPaddingField,
            this.borderField,
            this.alignmentField
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
        this.cellSpacingField.getInput().getEl().setValue(this.getOriginalCellSpacingElem().getValue());
        this.cellPaddingField.getInput().getEl().setValue(this.getOriginalCellPaddingElem().getValue());
        this.borderField.getInput().getEl().setValue(this.getOriginalBorderElem().getValue());
        (<Dropdown<string>>this.alignmentField.getInput()).setValue(this.getOriginalAlignmentElem().getValue());
    }

    private updateOriginalDialogInputValues() {
        this.getOriginalRowsElem().setValue(this.rowsField.getInput().getEl().getValue(), false);
        this.getOriginalColsElem().setValue(this.colsField.getInput().getEl().getValue(), false);
        this.getOriginalHeadersElem().setValue((<Dropdown<string>>this.headersField.getInput()).getValue(), false);
        this.getOriginalCellSpacingElem().setValue(this.cellSpacingField.getInput().getEl().getValue(), false);
        this.getOriginalCellPaddingElem().setValue(this.cellPaddingField.getInput().getEl().getValue(), false);
        this.getOriginalBorderElem().setValue(this.borderField.getInput().getEl().getValue(), false);
        this.getOriginalAlignmentElem().setValue((<Dropdown<string>>this.alignmentField.getInput()).getValue(), false);
    }

    private static isPositiveWholeNumber(input: api.dom.FormInputEl) {
        const valueAsNumber: number = NumberHelper.toNumber(input.getValue());

        if (!NumberHelper.isWholeNumber(valueAsNumber) || !(valueAsNumber > 0)) {
            return i18n('dialog.table.notawholenumber');
        }

        return undefined;
    }

    private static isPositiveNumber(input: api.dom.FormInputEl) {
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

}
