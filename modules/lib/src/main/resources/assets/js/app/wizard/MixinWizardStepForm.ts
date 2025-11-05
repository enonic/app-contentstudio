import Q from 'q';
import {ContentWizardStepForm} from './ContentWizardStepForm';
import {MixinName} from '../content/MixinName';
import {MixinDescriptor} from '../content/MixinDescriptor';
import {Form} from '@enonic/lib-admin-ui/form/Form';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentFormContext} from '../ContentFormContext';
import {ExtraData} from '../content/ExtraData';
import {ContentPanelStripHeader} from './ContentPanelStripHeader';

export class MixinWizardStepForm
    extends ContentWizardStepForm {

    declare protected outerHeader: ContentPanelStripHeader;

    private readonly mixin: MixinDescriptor;

    private enabled: boolean = false;

    private stashedData: PropertyTree;

    private enableChangedListeners: ((value: boolean) => void)[] = [];

    private static REGISTRY = new Map<string, MixinWizardStepForm>();

    constructor(mixin: MixinDescriptor) {
        super();
        this.addClass('mixins-wizard-step-form');

        this.mixin = mixin;

        MixinWizardStepForm.REGISTRY.set(this.mixin.getName(), this);
    }

    getMixin(): MixinDescriptor {
        return this.mixin;
    }

    getMixinName(): MixinName {
        return this.mixin.getMixinName();
    }

    getMixinNameAsString(): string {
        return this.mixin.getMixinName().toString();
    }

    setExpandState(value: boolean) {
        this.setEnabledState(value);
    }

    isExpandable(): boolean {
        return this.isOptional();
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    isOptional(): boolean {
        return this.mixin.isOptional();
    }

    resetData() {
        this.data.getRoot().reset();
        this.stashedData = null;
    }

    resetForm(): Q.Promise<void> {
        this.resetData();

        return this.enabled ? this.doLayout(this.form, this.data) : Q();
    }

    layout(formContext: ContentFormContext, data: PropertyTree, form: Form): Q.Promise<void> {
        this.enabled = !this.isOptional() || data.getRoot().getPropertyArrays().length > 0;
        return super.layout(formContext, data, form);
    }

    protected doLayout(form: Form, data: PropertyTree): Q.Promise<void> {
        if (this.enabled) {
            return super.doLayout(form, data);
        } else {
            this.formView = new FormView(this.formContext, form, data.getRoot());
        }

        return Q();
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
        this.outerHeader?.setTogglerState(this.enabled, true);
    }

    private setHeaderState(enabled: boolean, silent: boolean = false) {
        this.outerHeader?.setTogglerState(enabled, silent);
    }

    private setEnabledState(value: boolean, silent: boolean = false): Q.Promise<void> {
        const changed: boolean = value !== this.enabled;
        this.enabled = value;

        this.setVisible(this.enabled);

        if (!changed) {
            return Q();
        }

        let promise: Q.Promise<void>;
        if (this.enabled) {
            if (this.form && this.data) {
                if (this.stashedData) {
                    this.data.getRoot().addPropertiesFromSet(this.stashedData.getRoot());
                }

                promise = this.doLayout(this.form, this.data).then(() => {
                    this.validate();
                });
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

        return promise != null ? promise : Q();
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

    displayValidationErrors(display: boolean) {
        if (this.isValidationErrorToBeRendered()) {
            super.displayValidationErrors(display);
        }
    }

    private isValidationErrorToBeRendered(): boolean {
        if (this.formContext?.getFormState().isNew()) {
            return false;
        }

        if (!this.isOptional()) {
            return true;
        }

        return this.isEnabled() && this.isSaved();
    }

    private isSaved(): boolean {
        const persistedMixin: ExtraData =
            (this.formContext as ContentFormContext).getPersistedContent().getExtraDataByName(this.getMixinName());

        return persistedMixin?.getData()?.getRoot()?.getPropertyArrays().length > 0;
    }

    static getMixinsWizardStepForm(name: string): MixinWizardStepForm | undefined {
        return MixinWizardStepForm.REGISTRY.get(name);
    }
}
