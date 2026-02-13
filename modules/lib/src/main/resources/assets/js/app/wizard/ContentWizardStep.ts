import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {type ContentTabBarItem, ContentTabBarItemBuilder} from './ContentTabBarItem';
import {type WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
import {BaseWizardStep} from '@enonic/lib-admin-ui/app/wizard/BaseWizardStep';

export class ContentWizardStep
    extends BaseWizardStep<ContentTabBarItem> {

    constructor(label: string, stepForm: WizardStepForm, iconCls?: string) {

        const isOptionalXdata = ObjectHelper.iFrameSafeInstanceOf(stepForm, XDataWizardStepForm) &&
                                (stepForm as XDataWizardStepForm).isOptional();

        const tabBarItem = (new ContentTabBarItemBuilder().setLabel(label) as ContentTabBarItemBuilder)
                            .setIconCls(iconCls)
            .setIsXData(isOptionalXdata)
                            .build();

        super(tabBarItem, stepForm);
    }
}
