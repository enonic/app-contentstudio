import {ProjectItem} from '../data/ProjectItem';
import {SettingsItemWizardPanel} from './SettingsItemWizardPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {Validators} from 'lib-admin-ui/ui/form/Validators';
import * as Q from 'q';
import {SettingItemWizardStepForm} from './SettingItemWizardStepForm';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

export class ProjectWizardPanel
    extends SettingsItemWizardPanel<ProjectItem> {

    protected wizardStepForm: ProjectItemNameWizardStepForm;

    protected createWizardStepForm(): ProjectItemNameWizardStepForm {
        return new ProjectItemNameWizardStepForm();
    }

    protected getIconClass(): string {
        return 'icon-tree-2';
    }

    protected isNewItemChanged(): boolean {
        return super.isNewItemChanged() ||
               !StringHelper.isBlank(this.wizardStepForm.getProjectName());
    }

    protected isPersistedItemChanged(): boolean {
        const item: ProjectItem = this.getPersistedItem();

        if (!ObjectHelper.stringEquals(item.getName(), this.wizardStepForm.getProjectName())) {
            return true;
        }

        return super.isPersistedItemChanged();
    }
}

class ProjectItemNameWizardStepForm
    extends SettingItemWizardStepForm {

    private projectNameInput: TextInput;

    getProjectName(): string {
        return this.projectNameInput.getValue();
    }

    protected initListeners() {
        super.initListeners();
        this.projectNameInput.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-item-wizard-step-form');

            return rendered;
        });
    }

    layout(item: ProjectItem) {
        super.layout(item);

        this.projectNameInput.setValue(item.getName());
    }

    protected getFormItems(): FormItem[] {
        this.projectNameInput = new TextInput();

        return [new FormItemBuilder(this.projectNameInput).setValidator(Validators.required).setLabel(
            i18n('settings.field.project.name')).build()];
    }
}
