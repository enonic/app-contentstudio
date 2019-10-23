import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {ContentTabBarItem, ContentTabBarItemBuilder} from './ContentTabBarItem';
import {WizardStepForm} from 'lib-admin-ui/app/wizard/WizardStepForm';
import {BaseWizardStep} from 'lib-admin-ui/app/wizard/BaseWizardStep';

export class ContentWizardStep
    extends BaseWizardStep<ContentTabBarItem> {

    constructor(label: string, stepForm: WizardStepForm, iconCls?: string) {

        const isOptionalXdata = ObjectHelper.iFrameSafeInstanceOf(stepForm, XDataWizardStepForm) &&
                                (<XDataWizardStepForm>stepForm).isOptional();

        const tabBarItem = (<ContentTabBarItemBuilder>new ContentTabBarItemBuilder().setLabel(label))
                            .setIconCls(iconCls)
            .setIsXData(isOptionalXdata)
                            .build();

        super(tabBarItem, stepForm);
    }
}
