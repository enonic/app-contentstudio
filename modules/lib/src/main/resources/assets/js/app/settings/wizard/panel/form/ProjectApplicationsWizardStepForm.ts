import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import * as Q from 'q';
import {SettingsType} from '../../../data/type/SettingsType';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectApplicationsFormItem} from './element/ProjectApplicationsFormItem';
import {ProjectApplication, ProjectApplicationBuilder} from './element/ProjectApplication';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {ProjectApplicationsGetByKeysRequest} from '../../../resource/applications/ProjectApplicationsGetByKeysRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';

export class ProjectApplicationsWizardStepForm
    extends ProjectWizardStepForm {

    private applicationsFormItem: ProjectApplicationsFormItem;

    protected createFormItems(): FormItem[] {
        return [this.createApplicationsFormItem()];
    }

    private createApplicationsFormItem(): ProjectApplicationsFormItem {
        this.applicationsFormItem = new ProjectApplicationsFormItem();
        return this.applicationsFormItem;
    }

    getName(type: SettingsType): string {
        return i18n('settings.items.wizard.step.applications');
    }

    protected initListeners() {
        this.applicationsFormItem.getComboBox().onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        const appKeys: ApplicationKey[] = item.getSiteConfigs()?.map((config: ApplicationConfig) => config.getApplicationKey());

        if (appKeys?.length > 0) {
            return this.fetchApps(appKeys).then((apps: ProjectApplication[]) => {
                appKeys.forEach((appKey: ApplicationKey) => {
                    const app: ProjectApplication =
                        apps.find((app: ProjectApplication) => app.getName() === appKey.getName()) || this.generateNotAvailableApp(appKey);
                    this.applicationsFormItem.getComboBox().select(app, false, true);
                });
            }).catch(DefaultErrorHandler.handle);
        }

        return Q(null);
    }

    private fetchApps(keys: ApplicationKey[]): Q.Promise<ProjectApplication[]> {
        return new ProjectApplicationsGetByKeysRequest(keys).sendAndParse();
    }

    private generateNotAvailableApp(key: ApplicationKey): ProjectApplication {
        const builder: ProjectApplicationBuilder = ProjectApplication.create();

        builder.applicationKey = key;
        builder.displayName = key.toString();

        return builder.build();
    }

    getApplications(): ProjectApplication[] {
        return this.applicationsFormItem?.getComboBox().getSelectedDisplayValues() || [];
    }

}
