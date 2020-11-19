import {WizardStepForm} from 'lib-admin-ui/app/wizard/WizardStepForm';
import {FormItem} from 'lib-admin-ui/ui/form/FormItem';
import {Fieldset} from 'lib-admin-ui/ui/form/Fieldset';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {FormView} from 'lib-admin-ui/form/FormView';
import * as Q from 'q';
import {SettingsDataViewItem} from '../../../view/SettingsDataViewItem';
import {ValidationRecording} from 'lib-admin-ui/form/ValidationRecording';
import {SettingsType} from '../../../dialog/SettingsType';

export abstract class SettingDataItemWizardStepForm<ITEM extends SettingsDataViewItem<any>>
    extends WizardStepForm {

    protected item?: ITEM;

    private form: Form;

    private dataChangedListeners: { (): void }[] = [];

    constructor() {
        super();

        this.form = new Form(FormView.VALIDATION_CLASS);
    }

    setup(item?: ITEM) {
        this.item = item;
        this.addFormItems();
        this.initListeners();
    }

    setItem(item: ITEM) {
        this.item = item;
    }

    abstract layout(item: ITEM): Q.Promise<void>;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.form);
            this.addClass('settings-item-wizard-step-form');

            return rendered;
        });
    }

    validate(): ValidationRecording {
        this.form.validate(true);

        return new ValidationRecording();
    }

    onDataChanged(listener: () => void) {
        this.dataChangedListeners.push(listener);
    }

    unDataChanged(listener: () => void) {
        this.dataChangedListeners.filter((currentListener: () => void) => {
            return listener === currentListener;
        });
    }

    abstract getName(type: SettingsType): string;

    protected abstract getFormItems(): FormItem[];

    protected abstract initListeners();

    protected notifyDataChanged() {
        this.dataChangedListeners.forEach((listener: () => void) => {
            listener();
        });
    }

    addFormItem(formItem: FormItem) {
        const fieldSet: Fieldset = new Fieldset();
        fieldSet.add(formItem);
        this.form.add(fieldSet);
    }

    private addFormItems() {
        this.getFormItems().forEach((formItem: FormItem) => this.addFormItem(formItem));
    }

}
