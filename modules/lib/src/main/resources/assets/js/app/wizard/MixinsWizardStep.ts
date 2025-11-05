import {ContentWizardStep} from './ContentWizardStep';
import {MixinWizardStepForm} from './MixinWizardStepForm';
import {MixinName} from '../content/MixinName';

export class MixinsWizardStep
    extends ContentWizardStep {

    constructor(stepForm: MixinWizardStepForm, iconCls?: string) {
        super(stepForm.getMixin().getDisplayName(), stepForm, iconCls);
    }

    getStepForm(): MixinWizardStepForm {
        return this.stepForm as MixinWizardStepForm;
    }

    getXDataName(): MixinName {
        return (this.stepForm as MixinWizardStepForm).getMixinName();
    }
}
