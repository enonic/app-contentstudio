import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import * as Q from 'q';
import {ProjectAccessData} from '../data/ProjectAccessData';
import {ProjectReadAccessType} from '../../../../data/project/ProjectReadAccessType';
import {ReadAccessFormItem} from '../../../../wizard/panel/form/element/ReadAccessFormItem';

export class ProjectAccessDialogStep
    extends ProjectDialogStep {

    protected createFormItems(): FormItem[] {
        return [new ReadAccessFormItem()];
    }

    protected listenItemsEvents(): void {
        super.listenItemsEvents();

        this.getFormItem().getRadioGroup().onValueChanged(() => {
            this.notifyDataChanged();
        });

        this.getFormItem().getPrincipalComboBox().onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    getData(): Object {
        const readAccessString: string = this.getFormItem().getRadioGroup().getValue();

        const result: Object = {
            access: readAccessString
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM) {
            result['principals'] =
                this.getFormItem().getPrincipalComboBox().getSelectedDisplayValues().map((principal: Principal) => principal.getKey());
        }

        return result;
    }

    getReadAccess(): ProjectAccessData {
        if (!this.formItems) {
            return null;
        }

        const readAccessString: string = this.getFormItem().getRadioGroup().getValue();

        if (readAccessString === ProjectReadAccessType.PUBLIC) {
            return new ProjectAccessData(ProjectReadAccessType.PUBLIC);
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM) {
            const principals: Principal[] =
                this.getFormItem().getPrincipalComboBox().getSelectedDisplayValues();

            if (principals.length === 0) {
                return new ProjectAccessData(ProjectReadAccessType.PRIVATE);
            }

            return new ProjectAccessData(ProjectReadAccessType.CUSTOM, principals);
        }

        return new ProjectAccessData(ProjectReadAccessType.PRIVATE);
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

    private getFormItem(): ReadAccessFormItem {
        return <ReadAccessFormItem>this.formItems[0];
    }
}
