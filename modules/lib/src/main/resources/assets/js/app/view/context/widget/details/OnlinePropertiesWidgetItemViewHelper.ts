import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PropertiesWidgetItemViewHelper} from './PropertiesWidgetItemViewHelper';
import {PropertiesWidgetItemViewValue} from './PropertiesWidgetItemViewValue';
import {PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';
import * as Q from 'q';

export class OnlinePropertiesWidgetItemViewHelper
    extends PropertiesWidgetItemViewHelper {

    generateProps(): Q.Promise<Map<string, PropertiesWidgetItemViewValue>> {
        const propsMap: Map<string, PropertiesWidgetItemViewValue> = new Map<string, PropertiesWidgetItemViewValue>();

        this.setPropsPublishFromTime(propsMap);
        this.setPropsPublishToTime(propsMap);

        return Q(propsMap);
    }

    private setPropsPublishFromTime(propsMap: Map<string, PropertiesWidgetItemViewValue>) {
        const publishFromTime = this.item.getContentSummary().getPublishFromTime();

        if (publishFromTime) {
            propsMap.set(i18n('field.onlineFrom'), new PropertiesWidgetItemViewValue(DateTimeFormatter.createHtml(publishFromTime)));
        }
    }

    private setPropsPublishToTime(propsMap: Map<string, PropertiesWidgetItemViewValue>) {
        const publishToTime = this.item.getContentSummary().getPublishToTime();

        if (publishToTime) {
            propsMap.set(i18n('field.onlineTo'), new PropertiesWidgetItemViewValue(DateTimeFormatter.createHtml(publishToTime)));
        }
    }

    protected isFormAllowed(type: PropertiesWizardStepFormType): Q.Promise<boolean> {
        if (type === PropertiesWizardStepFormType.SCHEDULE) {
            return Q.resolve(this.isEditScheduleAllowed());
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
