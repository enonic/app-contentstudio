import * as Q from 'q';
import {ContentWizardStepForm} from './ContentWizardStepForm';
import {XDataName} from '../content/XDataName';
import {XData} from '../content/XData';
import {Form} from 'lib-admin-ui/form/Form';
import {FormView} from 'lib-admin-ui/form/FormView';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';

export class XDataWizardStepForm
    extends ContentWizardStepForm {

    private xData: XData;

    private enabled: boolean;

    private stashedData: PropertyTree;

    private enableChangedListeners: { (value: boolean): void }[] = [];

    constructor(xData: XData) {
        super();
        this.addClass('x-data-wizard-step-form');

        this.xData = xData;
    }

    getXData(): XData {
        return this.xData;
    }

    getXDataName(): XDataName {
        return this.xData.getXDataName();
    }

    getXDataNameAsString(): string {
        return this.xData.getXDataName().toString();
    }

    setExpandState(value: boolean) {
        this.setEnabledState(value);
    }

    isExpandable(): boolean {
        return this.xData.isOptional();
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    isOptional(): boolean {
        return this.xData.isOptional();
    }

    resetData() {
        this.data.getRoot().reset();
        this.stashedData = null;
    }

    resetForm(): Q.Promise<void> {
        this.resetData();

        return this.enabled ? this.doLayout(this.form, this.data) : Q(null);
    }

    protected doLayout(form: Form, data: PropertyTree): Q.Promise<void> {
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

        return Q(null);
    }

    update(data: PropertyTree, unchangedOnly: boolean = true): Q.Promise<void> {
        return super.update(data, unchangedOnly);
    }

    resetState(data?: PropertyTree): Q.Promise<void> {
        this.data = data || this.data;
        return this.setEnabledState(!this.isOptional() || this.data.getRoot().getPropertyArrays().length > 0, true).then(() => {
            this.resetHeaderState();
        });
    }

    resetHeaderState() {
        if (this.outerHeader) {
            this.outerHeader.setTogglerState(this.enabled, true);
        }
    }

    private setHeaderState(enabled: boolean, silent: boolean = false) {
        if (this.outerHeader) {
            this.outerHeader.setTogglerState(enabled, silent);
        }
    }

    private setEnabledState(value: boolean, silent: boolean = false): Q.Promise<void> {
        let changed: boolean = value !== this.enabled;
        this.enabled = value;

        this.enabled ? this.show() : this.hide();

        if (!changed) {
            return Q(null);
        }

        let promise: Q.Promise<void>;
        if (this.enabled) {
            if (this.form && this.data) {
                if (this.stashedData) {
                    this.data.getRoot().addPropertiesFromSet(this.stashedData.getRoot());
                }
                promise = this.doLayout(this.form, this.data);
            }
        } else {
            if (this.data) {
                this.stashedData = this.data.copy();
                this.data.getRoot().removeAllProperties();
            }

            if (this.formView) {
                this.formView.remove();
                this.formView = new FormView(this.formContext, this.form, this.data.getRoot());

                this.resetValidation();
            }
        }

        this.setHeaderState(this.enabled, true);

        if (!silent) {
            this.notifyEnableChanged(value);
        }

        return promise || Q(null);
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
