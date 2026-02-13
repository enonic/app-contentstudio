import Q from 'q';
import {type XDataWizardStepForm} from './XDataWizardStepForm';

export class XDataWizardStepForms {

    private readonly xDataStepFormByName: Record<string, XDataWizardStepForm>;

    constructor() {
        this.xDataStepFormByName = {};
    }

    forEach(callback: (form: XDataWizardStepForm) => void) {
        for (const key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {
                const form = this.xDataStepFormByName[key];
                callback(form);
            }
        }
    }

    contains(xDataName: string): boolean {
        return !!this.xDataStepFormByName.hasOwnProperty(xDataName);
    }

    get(xDataName: string): XDataWizardStepForm {
        return this.xDataStepFormByName[xDataName];
    }

    add(form: XDataWizardStepForm) {
        this.xDataStepFormByName[form.getXData().getName()] = form;
    }

    remove(xDataName: string) {
        delete this.xDataStepFormByName[xDataName];
    }

    reset() {
        this.forEach((form: XDataWizardStepForm) => {
            form.reset();
        });
    }

    resetDisabledForms() {
        this.forEach((form: XDataWizardStepForm) => {
            if (form.isExpandable() && !form.isEnabled()) {
                form.resetForm();
            }
        });
    }

    resetState(): Q.Promise<void[]> {
        const promises = [];

        this.forEach((form: XDataWizardStepForm) => {
            promises.push(form.resetState());
        });

        return Q.all(promises);
    }

    displayValidationErrors(value: boolean) {
        this.forEach((form: XDataWizardStepForm) => {
            form.displayValidationErrors(value);
        });
    }

    validate() {
        this.forEach((form: XDataWizardStepForm) => {
            form.validate();
        });
    }
}
