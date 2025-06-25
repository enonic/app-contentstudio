import {PropertiesWidgetItemView} from './PropertiesWidgetItemView';
import {PropertiesWidgetItemViewHelper} from './PropertiesWidgetItemViewHelper';
import {OnlinePropertiesWidgetItemViewHelper} from './OnlinePropertiesWidgetItemViewHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';
import {EditPropertiesDialogParams} from './EditPropertiesDialog';
import {Content} from '../../../../content/Content';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';

/**
 * @deprecated Use DetailsWidgetElement instead
 */
export class OnlinePropertiesWidgetItemView
    extends PropertiesWidgetItemView {

    protected createHelper(): PropertiesWidgetItemViewHelper {
        return new OnlinePropertiesWidgetItemViewHelper();
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
        return (this.helper as OnlinePropertiesWidgetItemViewHelper).isEditScheduleAllowed();
    }
}
