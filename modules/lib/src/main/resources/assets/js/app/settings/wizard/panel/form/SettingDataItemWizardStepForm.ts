import {WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
import {type FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import type Q from 'q';
import {type SettingsDataViewItem} from '../../../view/SettingsDataViewItem';
import {ValidationRecording} from '@enonic/lib-admin-ui/form/ValidationRecording';
import {type SettingsType} from '../../../data/type/SettingsType';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';

export abstract class SettingDataItemWizardStepForm<ITEM extends SettingsDataViewItem<Equitable>>
    extends WizardStepForm {

    protected item?: ITEM;

    private readonly form: Form;

    private formItems: FormItem[];

    private dataChangedListeners: (() => void)[] = [];

    constructor() {
        super();

        this.form = new Form(FormView.VALIDATION_CLASS);
    }

    setup(item?: ITEM) {
        this.item = item;
        this.formItems = this.createFormItems();
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

    protected abstract createFormItems(): FormItem[];

    protected abstract initListeners();

    protected notifyDataChanged() {
        this.dataChangedListeners.forEach((listener: () => void) => {
            listener();
        });
    }

    protected addFormItem(formItem: FormItem) {
        const fieldSet: Fieldset = new Fieldset();
        fieldSet.add(formItem);
        this.form.add(fieldSet);
    }

    private addFormItems() {
        this.formItems.forEach((formItem: FormItem) => this.addFormItem(formItem));
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        this.formItems.forEach((formItem: FormItem) => {
            formItem.getInput().setEnabled(enable);
        });
    }

}
