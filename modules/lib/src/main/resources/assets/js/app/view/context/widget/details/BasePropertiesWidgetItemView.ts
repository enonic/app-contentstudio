import {ContentLanguageUpdatedEvent} from '../../../../event/ContentLanguageUpdatedEvent';
import {PropertiesWidgetItemView} from './PropertiesWidgetItemView';
import {ContentServerEventsHandler} from '../../../../event/ContentServerEventsHandler';
import {type ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {type PropertiesWidgetItemViewHelper} from './PropertiesWidgetItemViewHelper';
import {BasePropertiesWidgetItemViewHelper} from './BasePropertiesWidgetItemViewHelper';
import {GetApplicationRequest} from '../../../../resource/GetApplicationRequest';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {type Application} from '@enonic/lib-admin-ui/application/Application';
import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';
import {type EditPropertiesDialogParams} from './EditPropertiesDialog';
import {type Content} from '../../../../content/Content';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';

export class BasePropertiesWidgetItemView
    extends PropertiesWidgetItemView {

    constructor() {
        super('base-properties-widget-item-view');
    }

    protected initListeners(): void {
        super.initListeners();

        ContentServerEventsHandler.getInstance().onContentPublished(this.handleContentPublished.bind(this));
    }

    private handleContentPublished(contents: ContentSummaryAndCompareStatus[]): void {
        if (!this.item) {
            return;
        }

        const thisContentId: string = this.item.getId();

        const contentSummary: ContentSummaryAndCompareStatus =
            contents.filter((content: ContentSummaryAndCompareStatus) => thisContentId === content.getId())[0];

        if (contentSummary) {
            this.setContentAndUpdateView(contentSummary);
        }
    }

    protected createHelper(): PropertiesWidgetItemViewHelper {
        return new BasePropertiesWidgetItemViewHelper();
    }

    protected fetchExtraData(): Q.Promise<void> {
        return this.fetchApplication().then((application: Application) => {
            (this.helper as BasePropertiesWidgetItemViewHelper).setApplication(application);
        });
    }

    private fetchApplication(): Q.Promise<Application> {
        const applicationKey: ApplicationKey = this.item.getType().getApplicationKey();

        if (applicationKey.isSystemReserved()) {
            return Q.resolve(null);
        }

        return new GetApplicationRequest(applicationKey).sendAndParse().catch(() => {
            return Q.resolve(null);
        });
    }

    protected getEditLinkText(): string {
        return i18n('widget.properties.edit.settings.text');
    }

    protected getFormsTypesToEdit(): PropertiesWizardStepFormType[] {
        return [PropertiesWizardStepFormType.SETTINGS];
    }

    protected createEditPropertiesDialogParams(): EditPropertiesDialogParams {
        return {
            title: i18n('widget.properties.edit.settings.text'),
            updatedHandler: (updatedContent: Content) => {
                NotifyManager.get().showFeedback(i18n('notify.properties.settings.updated', updatedContent.getName()));

                if (updatedContent.getLanguage() && updatedContent.getLanguage() !== this.item.getLanguage()) {
                    new ContentLanguageUpdatedEvent(updatedContent.getLanguage()).fire();
                }
            }
        };
    }
}
