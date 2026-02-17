import {type DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {type FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {type ProjectDialogStepData} from '../data/ProjectDialogStepData';
import {type Project} from '../../../../data/project/Project';
import {CopyFromParentFormItem} from '../../../../wizard/panel/form/element/CopyFromParentFormItem';
import type Q from 'q';

export abstract class ProjectDialogStep
    extends DialogStep {

    protected formItems: FormItem[];

    protected form: Form;

    protected parentProjects: Project[];

    getHtmlEl(): DivEl {
        if (!this.form) {
            this.setup();
        }

        return this.form;
    }

    private setup(): void {
        this.formItems = this.createFormItems();
        this.createForm();
        this.form.addClass(`project-dialog-step ${this.getFormClass()}`.trim());
        this.initEventListeners();
    }

    protected getFormClass(): string {
        return '';
    }

    private createForm(): void {
        this.form = new Form(FormView.VALIDATION_CLASS);

        const fieldSet: Fieldset = new Fieldset();

        this.formItems.forEach((formItem: FormItem) => {
            fieldSet.add(formItem);
        });

        this.form.add(fieldSet);
    }

    isOptional(): boolean {
        return true;
    }

    protected initEventListeners(): void {
        //
    }

    protected getParentProjects(): Project[] {
        return this.parentProjects;
    }

    protected hasParentProjects(): boolean {
        return this.parentProjects !== undefined && this.parentProjects.length > 0;
    }

    setParentProjects(projects: Project[]): Q.Promise<void> | void {
        this.parentProjects = projects;
        if (this.getFormItem()) {
            this.getFormItem().setParentProjects(projects);
        }
    }

    private getFormItem(): CopyFromParentFormItem {
        if (!this.formItems?.length) {
            return null;
        }

        if (!(this.formItems[0] instanceof CopyFromParentFormItem)) {
            return null;
        }

        return this.formItems[0];
    }

    abstract getData(): ProjectDialogStepData;

    abstract createFormItems(): FormItem[];
}
