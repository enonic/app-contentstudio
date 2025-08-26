import * as Q from 'q';
import {BeforeContentSavedEvent} from '../event/BeforeContentSavedEvent';
import {Form} from '@enonic/lib-admin-ui/form/Form';
import {FormContext} from '@enonic/lib-admin-ui/form/FormContext';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {WizardStepValidityChangedEvent} from '@enonic/lib-admin-ui/app/wizard/WizardStepValidityChangedEvent';
import {WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
import {FormValidityChangedEvent} from '@enonic/lib-admin-ui/form/FormValidityChangedEvent';
import {ValidationRecording} from '@enonic/lib-admin-ui/form/ValidationRecording';
import {ContentFormContext} from '../ContentFormContext';

export class ContentWizardStepForm
    extends WizardStepForm {

    protected formContext: FormContext;

    protected form: Form;

    protected formView: FormView;

    protected data: PropertyTree;

    constructor() {
        super();
    }

    update(data: PropertyTree, unchangedOnly: boolean = true): Q.Promise<void> {
        this.data = data;
        return this.formView.update(data.getRoot(), unchangedOnly);
    }

    reset() {
        return this.formView.reset();
    }

    layout(formContext: ContentFormContext, data: PropertyTree, form: Form): Q.Promise<void> {
        this.formContext = formContext;
        this.form = form;
        this.data = data;

        return this.doLayout(form, data);
    }

    protected doLayout(form: Form, data: PropertyTree): Q.Promise<void> {
        if (this.formView) {
            this.formView.remove();
        }

        this.formView = new FormView(this.formContext, form, data.getRoot());

        return this.formView.layout().then(() => {
            this.formView.onFocus((event) => {
                this.notifyFocused(event);
            });

            this.formView.onBlur((event) => {
                this.notifyBlurred(event);
            });

            this.appendChild(this.formView);

            this.formView.onValidityChanged((event: FormValidityChangedEvent) => {
                this.previousValidation = event.getRecording();
                this.notifyValidityChanged(new WizardStepValidityChangedEvent(event.isValid()));
            });

            if (!form || form.getFormItems().length === 0) {
                this.hide();
            }

            return Q(null);
        });
    }

    public validate(silent: boolean = false, forceNotify: boolean = false): ValidationRecording {
        const validationRecord: ValidationRecording = this.formView.validate(silent, forceNotify);
        this.previousValidation = validationRecord;
        return validationRecord;
    }

    public resetValidation() {
        this.previousValidation = new ValidationRecording();
        this.notifyValidityChanged(new WizardStepValidityChangedEvent(true));
    }

    public displayValidationErrors(display: boolean) {
        this.formView.displayValidationErrors(display);
    }

    getForm(): Form {
        return this.form;
    }

    getFormView(): FormView {
        return this.formView;
    }

    getData(): PropertyTree {

        return this.data;
    }

    giveFocus(): boolean {
        return this.formView.giveFocus();
    }

    toggleHelpText(show?: boolean) {
        this.formView.toggleHelpText(show);
    }

    hasHelpText(): boolean {
        return this.formView.hasHelpText();
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        this.formView.setEnabled(enable);
    }
}
