import '../../api.ts';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {ContentTabBarItem, ContentTabBarItemBuilder} from './ContentTabBarItem';
import WizardStepForm = api.app.wizard.WizardStepForm;

export class ContentWizardStep extends api.app.wizard.BaseWizardStep<ContentTabBarItem> {

    constructor(label: string, stepForm: WizardStepForm, iconCls?: string) {

        const isOptionalXdata = api.ObjectHelper.iFrameSafeInstanceOf(stepForm, XDataWizardStepForm) &&
                                (<XDataWizardStepForm>stepForm).isOptional();

        const tabBarItem = (<ContentTabBarItemBuilder>new ContentTabBarItemBuilder().setLabel(label))
                            .setIconCls(iconCls)
            .setIsXData(isOptionalXdata)
                            .build();

        super(tabBarItem, stepForm);
    }
}
