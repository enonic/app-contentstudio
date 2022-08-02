import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import * as Q from 'q';
import {ProjectAccessDialogStepData} from '../data/ProjectAccessDialogStepData';
import {ProjectReadAccessType} from '../../../../data/project/ProjectReadAccessType';
import {ProjectReadAccessFormItem} from '../../../../wizard/panel/form/element/ProjectReadAccessFormItem';

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
        if (!this.formItems) {
            return null;
        }

        const readAccessString: string = this.getFormItem().getRadioGroup().getValue();

        if (readAccessString === ProjectReadAccessType.PUBLIC) {
            return new ProjectAccessDialogStepData().setAccess(ProjectReadAccessType.PUBLIC);
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM) {
            const principals: Principal[] =
                this.getFormItem().getPrincipalComboBox().getSelectedDisplayValues();

            if (principals.length === 0) {
                return new ProjectAccessDialogStepData().setAccess(ProjectReadAccessType.PRIVATE);
            }

            return new ProjectAccessDialogStepData().setAccess(ProjectReadAccessType.CUSTOM).setPrincipals(principals);
        }

        return new ProjectAccessDialogStepData().setAccess(ProjectReadAccessType.PRIVATE);
    }

    protected getFormClass(): string {
        return 'project-read-access-step';
    }

    hasData(): boolean {
        return !!this.getFormItem().getRadioGroup().getValue();
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
        return <ProjectReadAccessFormItem>this.formItems[0];
    }
}
