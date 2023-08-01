import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import * as Q from 'q';
import {ProjectAccessDialogStepData} from '../data/ProjectAccessDialogStepData';
import {ProjectReadAccessType} from '../../../../data/project/ProjectReadAccessType';
import {ProjectReadAccessFormItem} from '../../../../wizard/panel/form/element/ProjectReadAccessFormItem';
import {Project} from '../../../../data/project/Project';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class ProjectAccessDialogStep
    extends ProjectDialogStep {

    protected createFormItems(): FormItem[] {
        return [new ProjectReadAccessFormItem()];
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.getFormItem().getRadioGroup().onValueChanged(() => {
            this.notifyDataChanged();
        });

        this.getFormItem().getPrincipalComboBox().onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    getData(): ProjectAccessDialogStepData {
        const data: ProjectAccessDialogStepData = new ProjectAccessDialogStepData();
        const readAccessString: string = this.getFormItem()?.getRadioGroup().getValue();

        if (StringHelper.isBlank(readAccessString)) {
            return data;
        }

        if (readAccessString === ProjectReadAccessType.PUBLIC.toString()) {
            return data.setAccess(ProjectReadAccessType.PUBLIC);
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM.toString()) {
            const principals: Principal[] =
                this.getFormItem().getPrincipalComboBox().getSelectedDisplayValues();

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

    setParentProject(value: Project) {
        this.getFormItem().setParentProject(value);
    }

    hasData(): boolean {
        return !!this.getFormItem()?.getRadioGroup().getValue();
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

    private getFormItem(): ProjectReadAccessFormItem {
        return this.formItems && this.formItems[0] as ProjectReadAccessFormItem;
    }
}
