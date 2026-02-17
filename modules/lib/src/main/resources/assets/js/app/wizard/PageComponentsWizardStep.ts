import {type ContentTabBarItem, ContentTabBarItemBuilder} from './ContentTabBarItem';
import {type WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
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
