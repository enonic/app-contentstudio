import * as Q from 'q';
import {XDataWizardStepForm} from './XDataWizardStepForm';

export class XDataWizardStepForms {

    private xDataStepFormByName: { [name: string]: XDataWizardStepForm; };

    constructor() {
        this.xDataStepFormByName = {};
    }

    forEach(callback: (form: XDataWizardStepForm) => void) {
        for (let key in this.xDataStepFormByName) {
            if (this.xDataStepFormByName.hasOwnProperty(key)) {
                const form = this.xDataStepFormByName[key];
                callback(form);
            }
        }
    }

    contains(xDataNameStr: string): boolean {
        return !!this.xDataStepFormByName.hasOwnProperty(xDataNameStr);
    }

    get(xDataNameStr: string): XDataWizardStepForm {
        return this.xDataStepFormByName[xDataNameStr];
    }

    add(form: XDataWizardStepForm) {
        this.xDataStepFormByName[form.getXData().getXDataName().toString()] = form;
    }

    remove(xDataNameStr: string) {
        delete this.xDataStepFormByName[xDataNameStr];
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

    validate(silent: boolean = false, forceNotify: boolean = false) {
        this.forEach((form: XDataWizardStepForm) => {
            form.validate(silent, forceNotify);
        });
    }
}
