import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';

export abstract class ProjectDialogStep
    extends DialogStep {

    protected formItems: FormItem[];

    protected form: Form;

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
        this.listenItemsEvents();
    }

    protected getFormClass(): string {
        return '';
    }

    protected createFormItems(): FormItem[] {
        return [];
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

    protected listenItemsEvents(): void {
        //
    }

    getData(): Object {
        return this.form.getFormData();
    }
}
