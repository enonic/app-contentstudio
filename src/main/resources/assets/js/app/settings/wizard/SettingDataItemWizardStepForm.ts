import {WizardStepForm} from 'lib-admin-ui/app/wizard/WizardStepForm';
import {FormItem} from 'lib-admin-ui/ui/form/FormItem';
import {Fieldset} from 'lib-admin-ui/ui/form/Fieldset';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {FormView} from 'lib-admin-ui/form/FormView';
import * as Q from 'q';
import {SettingsDataViewItem} from '../view/SettingsDataViewItem';

export abstract class SettingDataItemWizardStepForm<ITEM extends SettingsDataViewItem<any>>
    extends WizardStepForm {

    private form: Form;

    private dataChangedListeners: { (): void }[] = [];

    constructor() {
        super();

        this.form = new Form(FormView.VALIDATION_CLASS);

        this.addFormItems();
        this.initListeners();
    }

    abstract layout(item: ITEM);

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

    protected abstract initListeners();

    protected notifyDataChanged() {
        this.dataChangedListeners.forEach((listener: () => void) => {
            listener();
        });
    }

    private addFormItems() {
        const fieldSet: Fieldset = new Fieldset();

        this.getFormItems().forEach((formItem: FormItem) => {
            fieldSet.add(formItem);
        });

        this.form.add(fieldSet);
    }

}
