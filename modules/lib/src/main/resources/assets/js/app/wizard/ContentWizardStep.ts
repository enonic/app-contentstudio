import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {MixinWizardStepForm} from './MixinWizardStepForm';
import {ContentTabBarItem, ContentTabBarItemBuilder} from './ContentTabBarItem';
import {WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
import {BaseWizardStep} from '@enonic/lib-admin-ui/app/wizard/BaseWizardStep';

export class ContentWizardStep
    extends BaseWizardStep<ContentTabBarItem> {

    constructor(label: string, stepForm: WizardStepForm, iconCls?: string) {

        const isOptionalMixin = ObjectHelper.iFrameSafeInstanceOf(stepForm, MixinWizardStepForm) &&
                                (stepForm as MixinWizardStepForm).isOptional();

        const tabBarItem = (new ContentTabBarItemBuilder().setLabel(label) as ContentTabBarItemBuilder)
                            .setIconCls(iconCls)
            .setIsMixins(isOptionalMixin)
                            .build();

        super(tabBarItem, stepForm);
    }
}
