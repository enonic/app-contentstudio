import Q from 'q';
import {MixinWizardStepForm} from './MixinWizardStepForm';

export class MixinWizardStepForms {

    private readonly mixinsStepFormByName: Record<string, MixinWizardStepForm>;

    constructor() {
        this.mixinsStepFormByName = {};
    }

    forEach(callback: (form: MixinWizardStepForm) => void) {
        for (let key in this.mixinsStepFormByName) {
            if (this.mixinsStepFormByName.hasOwnProperty(key)) {
                const form = this.mixinsStepFormByName[key];
                callback(form);
            }
        }
    }

    contains(mixinName: string): boolean {
        return !!this.mixinsStepFormByName.hasOwnProperty(mixinName);
    }

    get(mixinName: string): MixinWizardStepForm {
        return this.mixinsStepFormByName[mixinName];
    }

    add(form: MixinWizardStepForm) {
        this.mixinsStepFormByName[form.getMixin().getName()] = form;
    }

    remove(mixinName: string) {
        delete this.mixinsStepFormByName[mixinName];
    }

    reset() {
        this.forEach((form: MixinWizardStepForm) => {
            form.reset();
        });
    }

    resetDisabledForms() {
        this.forEach((form: MixinWizardStepForm) => {
            if (form.isExpandable() && !form.isEnabled()) {
                form.resetForm();
            }
        });
    }

    resetState(): Q.Promise<void[]> {
        const promises = [];

        this.forEach((form: MixinWizardStepForm) => {
            promises.push(form.resetState());
        });

        return Q.all(promises);
    }

    displayValidationErrors(value: boolean) {
        this.forEach((form: MixinWizardStepForm) => {
            form.displayValidationErrors(value);
        });
    }

    validate() {
        this.forEach((form: MixinWizardStepForm) => {
            form.validate();
        });
    }
}
