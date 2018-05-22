import '../../api.ts';
import {ContentWizardStepForm} from './ContentWizardStepForm';
import Form = api.form.Form;
import FormView = api.form.FormView;
import PropertyTree = api.data.PropertyTree;

export class XDataWizardStepForm
    extends ContentWizardStepForm {

    private external: boolean;

    private enabled: boolean;

    private disabledData: PropertyTree;

    private enableChangedListeners: { (value: boolean): void }[] = [];

    constructor(external: boolean) {
        super();
        this.addClass('x-data-wizard-step-form');

        this.external = external;

        this.onRendered(() => {
            if (this.outerHeader) {
                this.outerHeader.setTogglerState(this.enabled, true);
            }
        });
    }

    setExpandState(value: boolean) {
        this.setEnabled(value);
    }

    isExpandable(): boolean {
        return this.external;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    resetForm() {
        this.data.getRoot().removeAllProperties();
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
            return super.doLayout(form, data);
        } else {
            this.formView = new FormView(this.formContext, form, data.getRoot());
        }

        return wemQ(null);
    }

    private setEnabled(value: boolean, silent: boolean = false) {
        let changed: boolean = false;
        if (value !== this.enabled) {
            changed = true;
        }
        this.enabled = value;

        if (changed && !silent) {
            this.notifyEnableChanged(value);
        }

        this.enabled ? this.show() : this.hide();

        if (changed) {
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
                }
            }
        }
    }

    private resetState(data: PropertyTree) {
        this.setEnabled(!this.external || data.getRoot().getSize() > 0, true);
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
