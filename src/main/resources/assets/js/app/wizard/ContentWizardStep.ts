import '../../api.ts';
import WizardStepForm = api.app.wizard.WizardStepForm;
import {XDataWizardStepForm} from './XDataWizardStepForm';

export class ContentWizardStep extends api.app.wizard.WizardStep {

    constructor(label: string, stepForm: WizardStepForm, iconCls?: string) {
        super(label, stepForm, iconCls);

        const isExternalXdata = api.ObjectHelper.iFrameSafeInstanceOf(stepForm, XDataWizardStepForm) &&
                                (<XDataWizardStepForm>stepForm).isExternal();
        this.getTabBarItem().toggleClass('x-data', isExternalXdata);
    }
}
