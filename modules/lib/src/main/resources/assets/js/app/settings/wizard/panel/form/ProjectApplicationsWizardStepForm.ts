import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import * as Q from 'q';
import {SettingsType} from '../../../data/type/SettingsType';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectApplicationsFormItem} from './element/ProjectApplicationsFormItem';

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
    //
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        return Q(null);
    }

}
