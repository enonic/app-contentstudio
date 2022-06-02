import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {OverrideNativeDialog} from './OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './ModalDialog';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {NumberHelper} from '@enonic/lib-admin-ui/util/NumberHelper';
import {Dropdown, DropdownConfig} from '@enonic/lib-admin-ui/ui/selector/dropdown/Dropdown';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
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

        this.captionField =
            this.createFormItem(new ModalDialogFormItemBuilder('caption', i18n('dialog.table.formitem.caption')));

        return [
            this.rowsField,
            this.colsField,
            this.headersField,
            this.captionField
        ];
    }

    private createHeadersDropdown(): Dropdown<string> {
        const headerDropdown: Dropdown<string> = new Dropdown<string>('headers', <DropdownConfig<string>>{});

        headerDropdown.addOption(Option.create<string>()
            .setValue('')
            .setDisplayValue(i18n('dialog.table.headers.none'))
            .build());
        headerDropdown.addOption(Option.create<string>()
            .setValue('row')
            .setDisplayValue(i18n('dialog.table.headers.row'))
            .build());
        headerDropdown.addOption(Option.create<string>()
            .setValue('col')
            .setDisplayValue(i18n('dialog.table.headers.col'))
            .build());
        headerDropdown.addOption(Option.create<string>()
            .setValue('both')
            .setDisplayValue(i18n('dialog.table.headers.both'))
            .build());

        return headerDropdown;
    }

    protected setDialogInputValues() {
        this.rowsField.getInput().getEl().setValue(this.getOriginalRowsElem().getValue());
        this.rowsField.getInput().getEl().setDisabled(this.dialogType === DialogType.TABLEPROPERTIES);
        this.colsField.getInput().getEl().setValue(this.getOriginalColsElem().getValue());
        this.colsField.getInput().getEl().setDisabled(this.dialogType === DialogType.TABLEPROPERTIES);
        (<Dropdown<string>>this.headersField.getInput()).setValue(this.getOriginalHeadersElem().getValue());
        this.captionField.getInput().getEl().setValue(this.getOriginalCaptionElem().getValue());
    }

    private updateOriginalDialogInputValues() {
        this.getOriginalRowsElem().setValue(this.rowsField.getInput().getEl().getValue(), false);
        this.getOriginalColsElem().setValue(this.colsField.getInput().getEl().getValue(), false);
        this.getOriginalHeadersElem().setValue((<Dropdown<string>>this.headersField.getInput()).getValue(), false);
        this.getOriginalCaptionElem().setValue(this.captionField.getInput().getEl().getValue(), false);
    }

    private static isPositiveWholeNumber(input: FormInputEl) {
        const valueAsNumber: number = NumberHelper.toNumber(input.getValue());

        if (!NumberHelper.isWholeNumber(valueAsNumber) || !(valueAsNumber > 0)) {
            return i18n('dialog.table.notawholenumber');
        }

        return undefined;
    }

    private getOriginalRowsElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'txtRows');
    }

    private getOriginalColsElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'txtCols');
    }

    private getOriginalHeadersElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'selHeaders');
    }

    private getOriginalCaptionElem(): CKEDITOR.ui.dialog.uiElement {
        return this.getElemFromOriginalDialog('info', 'txtCaption');
    }

}
