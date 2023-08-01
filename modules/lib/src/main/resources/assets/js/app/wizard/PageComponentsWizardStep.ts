import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {XDataWizardStepForm} from './XDataWizardStepForm';
import {ContentTabBarItem, ContentTabBarItemBuilder} from './ContentTabBarItem';
import {WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
import {BaseWizardStep} from '@enonic/lib-admin-ui/app/wizard/BaseWizardStep';

export class PageComponentsWizardStep
    extends BaseWizardStep<ContentTabBarItem> {

    constructor(label: string, stepForm: WizardStepForm, iconCls?: string) {


        const tabBarItem = (new ContentTabBarItemBuilder().setLabel(label) as ContentTabBarItemBuilder)
            .setIconCls(iconCls)
            .build();

        super(tabBarItem, stepForm);
    }
}
