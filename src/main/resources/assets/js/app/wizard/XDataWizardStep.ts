import {ContentWizardStep} from './ContentWizardStep';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {ContentWizardStepForm} from './ContentWizardStepForm';
import {XDataName} from '../content/XDataName';

export class XDataWizardStep
    extends ContentWizardStep {

    constructor(label: string, stepForm: ContentWizardStepForm, iconCls?: string) {
        super(label, stepForm, iconCls);
    }

    getStepForm(): XDataWizardStepForm {
        return <XDataWizardStepForm>this.stepForm;
    }

    getXDataName(): XDataName {
        return (<XDataWizardStepForm>this.stepForm).getXDataName();
    }
}
