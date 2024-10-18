import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import * as Q from 'q';
import {ProjectAccessDialogStepData} from '../data/ProjectAccessDialogStepData';
import {ProjectReadAccessType} from '../../../../data/project/ProjectReadAccessType';
import {ProjectReadAccessFormItem} from '../../../../wizard/panel/form/element/ProjectReadAccessFormItem';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class ProjectAccessDialogStep
    extends ProjectDialogStep {

    private readAccessFormItem: ProjectReadAccessFormItem;

    createFormItems(): FormItem[] {
        this.readAccessFormItem = new ProjectReadAccessFormItem();
        if (this.hasParentProjects()) {
            this.readAccessFormItem.setParentProjects(this.getParentProjects());
        }
        return [this.readAccessFormItem];
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.readAccessFormItem.getRadioGroup().onValueChanged(() => this.notifyDataChanged());

        this.readAccessFormItem.getPrincipalComboBox().onSelectionChanged(() => {
            this.notifyDataChanged();
        });
    }

    getData(): ProjectAccessDialogStepData {
        const data: ProjectAccessDialogStepData = new ProjectAccessDialogStepData();
        const readAccessString: string = this.readAccessFormItem?.getRadioGroup().getValue();

        if (StringHelper.isBlank(readAccessString)) {
            return data;
        }

        if (readAccessString === ProjectReadAccessType.PUBLIC.toString()) {
            return data.setAccess(ProjectReadAccessType.PUBLIC);
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM.toString()) {
            const principals: Principal[] =
                this.readAccessFormItem.getPrincipalComboBox().getSelectedOptions().map(option => option.getOption().getDisplayValue());

            if (principals.length === 0) {
                return data.setAccess(ProjectReadAccessType.PRIVATE);
            }

            return data.setAccess(ProjectReadAccessType.CUSTOM).setPrincipals(principals);
        }

        return data.setAccess(ProjectReadAccessType.PRIVATE);
    }

    protected getFormClass(): string {
        return 'project-read-access-step';
    }

    hasData(): boolean {
        return !!this.readAccessFormItem?.getRadioGroup().getValue();
    }

    isValid(): Q.Promise<boolean> {
        return Q.resolve(this.hasData());
    }

    isOptional(): boolean {
        return false;
    }

    getName(): string {
        return 'projectAccess';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.access.description');
    }
}
