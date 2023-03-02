import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PropertiesWidgetItemViewHelper} from './PropertiesWidgetItemViewHelper';
import {PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';
import * as Q from 'q';

export class OnlinePropertiesWidgetItemViewHelper
    extends PropertiesWidgetItemViewHelper {

    generateProps(): Map<string, string> {
        const propsMap: Map<string, string> = new Map<string, string>();

        this.setPropsPublishFromTime(propsMap);
        this.setPropsPublishToTime(propsMap);

        return propsMap;
    }

    private setPropsPublishFromTime(propsMap: Map<string, string>) {
        if (this.item.getContentSummary().getPublishFromTime()) {
            propsMap.set(i18n('field.onlineFrom'), DateTimeFormatter.createHtml(this.item.getContentSummary().getPublishFromTime()));
        }
    }

    private setPropsPublishToTime(propsMap: Map<string, string>) {
        if (this.item.getContentSummary().getPublishToTime()) {
            propsMap.set(i18n('field.onlineTo'), DateTimeFormatter.createHtml(this.item.getContentSummary().getPublishToTime()));
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
