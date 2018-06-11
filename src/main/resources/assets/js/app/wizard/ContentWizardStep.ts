import '../../api.ts';
import WizardStepForm = api.app.wizard.WizardStepForm;
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {ContentTabBarItem, ContentTabBarItemBuilder} from './ContentTabBarItem';

export class ContentWizardStep extends api.app.wizard.BaseWizardStep<ContentTabBarItem> {

    constructor(label: string, stepForm: WizardStepForm, iconCls?: string) {

        const isExternalXdata = api.ObjectHelper.iFrameSafeInstanceOf(stepForm, XDataWizardStepForm) &&
                                (<XDataWizardStepForm>stepForm).isExternal();

        const tabBarItem = (<ContentTabBarItemBuilder>new ContentTabBarItemBuilder().setLabel(label))
                            .setIconCls(iconCls)
                            .setIsXData(isExternalXdata)
                            .build();

        super(tabBarItem, stepForm);
    }
}
