import {ContentWizardStep} from './ContentWizardStep';
import {type XDataWizardStepForm} from './XDataWizardStepForm';
import {type XDataName} from '../content/XDataName';

export class XDataWizardStep
    extends ContentWizardStep {

    constructor(stepForm: XDataWizardStepForm, iconCls?: string) {
        super(stepForm.getXData().getDisplayName(), stepForm, iconCls);
    }

    getStepForm(): XDataWizardStepForm {
        return this.stepForm as XDataWizardStepForm;
    }

    getXDataName(): XDataName {
        return (this.stepForm as XDataWizardStepForm).getXDataName();
    }
}
