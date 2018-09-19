import '../../api.ts';
import {ContentWizardStepForm} from './ContentWizardStepForm';
import Form = api.form.Form;
import FormView = api.form.FormView;
import PropertyTree = api.data.PropertyTree;

export class XDataWizardStepForm
    extends ContentWizardStepForm {

    private optional: boolean;

    private enabled: boolean;

    private disabledData: PropertyTree;

    private enableChangedListeners: { (value: boolean): void }[] = [];

    constructor(external: boolean) {
        super();
        this.addClass('x-data-wizard-step-form');

        this.optional = external;
    }

    setExpandState(value: boolean) {
        this.setEnabled(value);
    }

    isExpandable(): boolean {
        return this.optional;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    isOptional(): boolean {
        return this.optional;
    }

    resetForm() {
        this.data.getRoot().reset();
        this.disabledData = null;

        if (this.enabled) {
            this.doLayout(this.form, this.data);
        }
    }

    protected doLayout(form: Form, data: PropertyTree): wemQ.Promise<void> {
        if (this.enabled === undefined) {
            this.resetState(data);
        }

        if (this.enabled) {
            return super.doLayout(form, data).then(() => {
                this.validate(false);
            });
        } else {
            this.formView = new FormView(this.formContext, form, data.getRoot());
        }

        return wemQ(null);
    }

    update(data: PropertyTree, unchangedOnly: boolean = true): wemQ.Promise<void> {
        return super.update(data, unchangedOnly);
    }

    resetState(data: PropertyTree) {
        this.setEnabled(!this.optional || data.getRoot().getSize() > 0, true);
    }

    private setEnabled(value: boolean, silent: boolean = false) {
        let changed: boolean = value !== this.enabled;
        this.enabled = value;

        this.enabled ? this.show() : this.hide();

        if (!changed) {
            return;
        }

        if (this.enabled) {
            if (this.form && this.data) {
                if (this.disabledData) {
                    this.data.getRoot().addPropertiesFromSet(this.disabledData.getRoot());
                }
                this.doLayout(this.form, this.data);
            }
        } else {
            if (this.data) {
                this.disabledData = this.data.copy();
                this.data.getRoot().removeAllProperties();
            }

            if (this.formView) {
                this.formView.remove();
                this.formView = new FormView(this.formContext, this.form, this.data.getRoot());

                this.resetValidation();
            }
        }

        if (this.outerHeader) {
            this.outerHeader.setTogglerState(this.enabled, true);
        }

        if (!silent) {
            this.notifyEnableChanged(value);
        }
    }

    onEnableChanged(listener: (value: boolean) => void) {
        this.enableChangedListeners.push(listener);
    }

    unEnableChanged(listener: (value: boolean) => void) {
        this.enableChangedListeners = this.enableChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyEnableChanged(value: boolean) {
        this.enableChangedListeners.forEach((listener) => {
            listener(value);
        });
    }
}
