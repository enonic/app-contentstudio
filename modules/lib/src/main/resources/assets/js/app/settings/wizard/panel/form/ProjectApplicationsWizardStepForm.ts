import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {type FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {type ProjectViewItem} from '../../../view/ProjectViewItem';
import Q from 'q';
import {type SettingsType} from '../../../data/type/SettingsType';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectApplicationsFormItem} from './element/ProjectApplicationsFormItem';
import {type ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ProjectApplicationsFormParams} from './element/ProjectApplicationsFormParams';
import {type Project} from '../../../data/project/Project';

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
        this.applicationsFormItem.getComboBox().onDataChanged(() => this.notifyDataChanged());
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q();
        }

        return this.applicationsFormItem.layout(item);
    }

    getApplicationConfigs(): ApplicationConfig[] {
        return this.applicationsFormItem?.getSiteConfigs() || [];
    }

    getNonInheritedApplicationConfigs(): ApplicationConfig[] {
        return this.applicationsFormItem?.getNonInheritedApplicationConfigs() || [];
    }

    updateBaseUrlInSiteConfig(baseUrl: string): void {
        if (StringHelper.isBlank(baseUrl)) {
            this.applicationsFormItem.getComboBox().removePortalApp();
        } else {
            this.applicationsFormItem.getComboBox().addAndUpdatePortalApp(baseUrl);
        }
    }


    setParentProjects(projects: Project[]) {
        super.setParentProjects(projects);
        this.applicationsFormItem.getComboBox().setParentProjects(projects);
    }
}
