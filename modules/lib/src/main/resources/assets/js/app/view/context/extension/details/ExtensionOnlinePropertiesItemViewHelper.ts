import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ExtensionPropertiesItemViewHelper} from './ExtensionPropertiesItemViewHelper';
import {ExtensionPropertiesItemViewValue} from './ExtensionPropertiesItemViewValue';
import {PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';
import Q from 'q';

export class ExtensionOnlinePropertiesItemViewHelper
    extends ExtensionPropertiesItemViewHelper {

    generateProps(): Q.Promise<Map<string, ExtensionPropertiesItemViewValue>> {
        const propsMap: Map<string, ExtensionPropertiesItemViewValue> = new Map<string, ExtensionPropertiesItemViewValue>();

        this.setPropsPublishFromTime(propsMap);
        this.setPropsPublishToTime(propsMap);

        return Q(propsMap);
    }

    private setPropsPublishFromTime(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        const publishFromTime = this.item.getContentSummary().getPublishFromTime();

        if (publishFromTime) {
            propsMap.set(i18n('field.onlineFrom'), new ExtensionPropertiesItemViewValue(DateTimeFormatter.createHtml(publishFromTime)));
        }
    }

    private setPropsPublishToTime(propsMap: Map<string, ExtensionPropertiesItemViewValue>) {
        const publishToTime = this.item.getContentSummary().getPublishToTime();

        if (publishToTime) {
            propsMap.set(i18n('field.onlineTo'), new ExtensionPropertiesItemViewValue(DateTimeFormatter.createHtml(publishToTime)));
        }
    }

    protected isFormAllowed(type: PropertiesWizardStepFormType): Q.Promise<boolean> {
        if (type === PropertiesWizardStepFormType.SCHEDULE) {
            return Q.resolve(false);
        }

        return super.isFormAllowed(type);
    }

    isEditScheduleAllowed(): boolean {
        if (this.item.getContentSummary().getPublishFromTime() != null || this.item.getContentSummary().getPublishFromTime() != null) {
            return true;
        }

        return this.item.getContentSummary().getPublishFirstTime() != null && this.item.isPublished();
    }
}
