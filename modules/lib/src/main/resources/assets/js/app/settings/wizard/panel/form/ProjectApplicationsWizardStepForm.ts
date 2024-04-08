import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import * as Q from 'q';
import {SettingsType} from '../../../data/type/SettingsType';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectApplicationsFormItem} from './element/ProjectApplicationsFormItem';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ProjectApplication} from './element/ProjectApplication';
import {ProjectApplicationsFormParams} from './element/ProjectApplicationsFormParams';

export class ProjectApplicationsWizardStepForm
    extends ProjectWizardStepForm {

    private applicationsFormItem: ProjectApplicationsFormItem;

    protected createFormItems(): FormItem[] {
        return [this.createApplicationsFormItem()];
    }

    private createApplicationsFormItem(): ProjectApplicationsFormItem {
        this.applicationsFormItem = new ProjectApplicationsFormItem(new ProjectApplicationsFormParams(this.item?.getData(), true));
        return this.applicationsFormItem;
    }

    getName(type: SettingsType): string {
        return i18n('settings.items.wizard.step.applications');
    }

    protected initListeners() {
        this.applicationsFormItem.getComboBox().onDataChanged(() => {
            this.notifyDataChanged();
        });
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q.resolve();
        }

        return this.applicationsFormItem.layout(item);
    }

    getApplicationConfigs(): ApplicationConfig[] {
        return this.applicationsFormItem?.getComboBox()
            .getSelectedApplications()
            .map((app: ProjectApplication) => app.getConfig()?.clone()) || [];
    }

}
