import * as Q from 'q';
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
                this.notifyValidityChanged(new WizardStepValidityChangedEvent(event.isValid()));
            });

            if (form.getFormItems().length === 0) {
                this.hide();
            }
        });
    }

    public validate(silent: boolean = false, forceNotify: boolean = false): ValidationRecording {
        return this.formView.validate(silent, forceNotify);
    }

    public isValid(): boolean {
        return this.formView.isValid();
    }

    public resetValidation() {
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
