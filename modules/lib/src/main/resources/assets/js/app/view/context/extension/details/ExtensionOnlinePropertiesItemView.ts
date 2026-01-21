import {ExtensionPropertiesItemView} from './ExtensionPropertiesItemView';
import {type ExtensionPropertiesItemViewHelper} from './ExtensionPropertiesItemViewHelper';
import {ExtensionOnlinePropertiesItemViewHelper} from './ExtensionOnlinePropertiesItemViewHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';
import {type EditPropertiesDialogParams} from './EditPropertiesDialog';
import {type Content} from '../../../../content/Content';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';

export class ExtensionOnlinePropertiesItemView
    extends ExtensionPropertiesItemView {

    protected createHelper(): ExtensionPropertiesItemViewHelper {
        return new ExtensionOnlinePropertiesItemViewHelper();
    }

    protected getEditLinkText(): string {
        return i18n('widget.properties.edit.schedule.text');
    }

    protected getFormsTypesToEdit(): PropertiesWizardStepFormType[] {
        return [PropertiesWizardStepFormType.SCHEDULE];
    }

    protected createEditPropertiesDialogParams(): EditPropertiesDialogParams {
        return {
            title: i18n('widget.properties.edit.schedule.text'),
            updatedHandler: (updatedContent: Content) => {
                NotifyManager.get().showFeedback(i18n('notify.properties.schedule.updated', updatedContent.getName()));
            }
        };
    }

    protected isAllowedToBeShown(): boolean {
        return (this.helper as ExtensionOnlinePropertiesItemViewHelper).isEditScheduleAllowed();
    }
}
