import {WizardStepForm} from 'lib-admin-ui/app/wizard/WizardStepForm';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Fieldset} from 'lib-admin-ui/ui/form/Fieldset';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {FormView} from 'lib-admin-ui/form/FormView';
import * as Q from 'q';
import {SettingsDataViewItem} from '../view/SettingsDataViewItem';

export abstract class SettingDataItemWizardStepForm<ITEM extends SettingsDataViewItem<any>>
    extends WizardStepForm {

    private descriptionInput: TextInput;

    private form: Form;

    private dataChangedListeners: { (): void }[] = [];

    constructor() {
        super();

        this.descriptionInput = new TextInput();
        this.form = new Form(FormView.VALIDATION_CLASS);

        this.addFormItems();
        this.initListeners();
    }

    getDescription(): string {
        return this.descriptionInput.getValue();
    }

    layout(item: ITEM) {
        this.descriptionInput.setValue(item.getDescription());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.form);
            this.addClass('settings-item-wizard-step-form');

            return rendered;
        });
    }

    onDataChanged(listener: () => void) {
        this.dataChangedListeners.push(listener);
    }

    unDataChanged(listener: () => void) {
        this.dataChangedListeners.filter((currentListener: () => void) => {
            return listener === currentListener;
        });
    }

    protected abstract getFormItems(): FormItem[];

    protected initListeners() {
        this.descriptionInput.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    protected notifyDataChanged() {
        this.dataChangedListeners.forEach((listener: () => void) => {
            listener();
        });
    }

    private addFormItems() {
        const descriptionFormItem: FormItem = new FormItemBuilder(this.descriptionInput).setLabel(i18n('field.description')).build();
        const fieldSet: Fieldset = new Fieldset();
        this.getFormItems().forEach((formItem: FormItem) => {
            fieldSet.add(formItem);
        });
        fieldSet.add(descriptionFormItem);

        this.form.add(fieldSet);
    }
}
