import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {OverrideNativeDialog} from './OverrideNativeDialog';
import {HtmlAreaModalDialogConfig, ModalDialogFormItemBuilder} from './ModalDialog';
import {Dropdown, DropdownConfig} from '@enonic/lib-admin-ui/ui/selector/dropdown/Dropdown';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import eventInfo = CKEDITOR.eventInfo;

export abstract class ListStyleModalDialog
    extends OverrideNativeDialog {

    protected typeField: FormItem;

    constructor(config: eventInfo) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            dialog: config.data,
            class: 'list-style-modal-dialog',
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });
    }

    protected initElements() {
        super.initElements();

        this.setSubmitAction(new Action(i18n('action.insert')));
    }

    protected initListeners() {
        super.initListeners();

        this.submitAction.onExecuted(() => {
            if (this.validate()) {
                this.setOriginalDialogValues();
                this.ckeOriginalDialog.getButton('ok').click();
                this.close();
            }
        });
    }

    protected setOriginalDialogValues(): void {
        this.getElemFromOriginalDialog('info', 'type').setValue(this.getDropdownValue(), false);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addAction(this.submitAction);
            this.addCancelButtonToBottom();
            this.setHeading(this.getTitle());

            return rendered;
        });
    }

    protected abstract getTitle(): string;

    protected getMainFormItems(): FormItem[] {
        const typeFormItemBuilder = new ModalDialogFormItemBuilder('type', i18n('dialog.list.type'))
            .setValidator(Validators.required)
            .setInputEl(this.initTypeDropdown());
        this.typeField = this.createFormItem(typeFormItemBuilder);

        return [this.typeField];
    }

    private initTypeDropdown(): Dropdown<string> {
        const typeDropdown: Dropdown<string> = new Dropdown<string>('type', <DropdownConfig<string>>{});
        typeDropdown.addClass('type-dropdown');

        this.createTypeValuesMap().forEach((value: string, key: string) => {
            typeDropdown.addOption(Option.create<string>()
                .setValue(key)
                .setDisplayValue(value)
                .build());
        });

        typeDropdown.setValue(this.getOriginalTypeFieldValue());

        return typeDropdown;
    }

    protected abstract createTypeValuesMap(): Map<string, string>;

    protected setDialogInputValues() {
        //
    }

    private getOriginalTypeFieldValue(): string {
        return (<string>this.ckeOriginalDialog.getValueOf('info', 'type')) || 'notset';
    }

    private getDropdownValue(): string {
        const value: string = (<Dropdown<string>>this.typeField.getInput()).getValue();

        return value === 'notset' ? '' : value;
    }
}
