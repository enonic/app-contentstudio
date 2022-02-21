import {FormItem} from 'lib-admin-ui/ui/form/FormItem';
import {i18n} from 'lib-admin-ui/util/Messages';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {ModalDialogFormItemBuilder} from './ModalDialog';
import {FormInputEl} from 'lib-admin-ui/dom/FormInputEl';
import {NumberHelper} from 'lib-admin-ui/util/NumberHelper';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ListStyleModalDialog} from './ListStyleModalDialog';

export class NumberedListModalDialog
    extends ListStyleModalDialog {

    private startField: FormItem;

    protected setOriginalDialogValues() {
        super.setOriginalDialogValues();

        this.ckeOriginalDialog.setValueOf('info', 'start', this.startField.getInput().getEl().getValue());
    }

    protected getMainFormItems(): FormItem[] {
        const startFieldFormItemBuilder = new ModalDialogFormItemBuilder('start', i18n('dialog.list.numbered.start'))
            .setValidator(this.validateStartValue.bind(this));
        this.startField = this.createFormItem(startFieldFormItemBuilder);

        this.setElementToFocusOnShow(this.startField.getInput());

        return [this.startField, ...super.getMainFormItems()];
    }

    private validateStartValue(input: FormInputEl): string {
        if (StringHelper.isBlank(input.getValue())) {
            return i18n('field.value.required');
        }

        const value: number = NumberHelper.toNumber(input.getValue());

        if (!value || value < 0 || !NumberHelper.isWholeNumber(value)) {
            return i18n('field.value.invalid');
        }

        return null;
    }

    protected setDialogInputValues() {
        this.startField.getInput().getEl().setValue(<string>this.ckeOriginalDialog.getValueOf('info', 'start'));
    }

    protected createTypeValuesMap(): Map<string, string> {
        const map: Map<string,string> = new Map<string, string>();

        map.set('notset', this.getEditor().lang['liststyle']?.notset || 'Not Set');
        map.set('lower-roman', this.getEditor().lang['liststyle']?.lowerRoman || 'Lower Roman');
        map.set('upper-roman', this.getEditor().lang['liststyle']?.upperRoman || 'Upper Roman');
        map.set('lower-alpha', this.getEditor().lang['liststyle']?.lowerAlpha || 'Lower Alpha');
        map.set('upper-alpha', this.getEditor().lang['liststyle']?.upperAlpha || 'Upper Alpha');
        map.set('decimal', this.getEditor().lang['liststyle']?.decimal || 'Decimal');

        return map;
    }

    isDirty(): boolean {
        return (<TextInput>this.startField.getInput()).isDirty();
    }

    protected getTitle(): string {
        return i18n('dialog.list.numbered.title');
    }
}
