import {ContentWizardStep} from './ContentWizardStep';
import {type XDataWizardStepForm} from './XDataWizardStepForm';
import {type MixinName} from '../content/MixinName';

export class XDataWizardStep
    extends ContentWizardStep {

    constructor(stepForm: XDataWizardStepForm, iconCls?: string) {
        super(stepForm.getXData().getDisplayName(), stepForm, iconCls);
    }

    getStepForm(): XDataWizardStepForm {
        return this.stepForm as XDataWizardStepForm;
    }

    getXDataName(): MixinName {
        return (this.stepForm as XDataWizardStepForm).getXDataName();
    }
}
