import {WizardStepForm} from 'lib-admin-ui/app/wizard/WizardStepForm';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Fieldset} from 'lib-admin-ui/ui/form/Fieldset';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {FormView} from 'lib-admin-ui/form/FormView';
import * as Q from 'q';
import {SettingsItem} from '../data/SettingsItem';

export abstract class SettingItemWizardStepForm
    extends WizardStepForm {

    private descriptionInput: TextInput;

    private form: Form;

    constructor() {
        super();

        this.descriptionInput = new TextInput();
        this.form = new Form(FormView.VALIDATION_CLASS);

        this.addFormItems();
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

    protected abstract getFormItems(): FormItem[];

    getDescription(): string {
        return this.descriptionInput.getValue();
    }

    layout(item: SettingsItem) {
        this.descriptionInput.setValue(item.getDescription());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.form);
            this.addClass('settings-item-wizard-step-form');

            return rendered;
        });
    }
}
