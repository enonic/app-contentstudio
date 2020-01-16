import '../../api.ts';
import * as _ from 'lodash';

export class DisplayNameResolver implements api.app.wizard.DisplayNameGenerator {

    private formView: api.form.FormView;

    private expression: string;

    readonly excludedInputTypes: string[] = ['htmlarea'];

    setFormView(value: api.form.FormView): DisplayNameResolver {
        this.formView = value;
        return this;
    }

    setExpression(value: string): DisplayNameResolver {
        this.expression = value;
        return this;
    }

    hasExpression(): boolean {
        return !api.util.StringHelper.isBlank(this.expression);
    }

    execute(): string {
        api.util.assertNotNull(this.formView, 'formView not set');
        api.util.assertNotNull(this.expression, 'expression not set');

        return this.safeEval();
    }

    private sanitizeFieldValue(value: string) {
        let result = value;
        result = result.replace(/(<([^>]+)>)/ig,'');    // Strip HTML tags
        result = result.replace(/(\r\n|\n|\r)/gm,'');   // Strip linebreaks

        return result;
    }

    private isExcludedInputType(inputType: api.form.InputTypeName) {
        return this.excludedInputTypes.indexOf(inputType.getName().toLowerCase()) > -1;
    }

    private getFormItems(container: any): api.form.FormItem[] {
        let formItems = [];
        if (api.ObjectHelper.iFrameSafeInstanceOf(container, api.form.Form) ||
            api.ObjectHelper.iFrameSafeInstanceOf(container, api.form.FieldSet) ||
            api.ObjectHelper.iFrameSafeInstanceOf(container, api.form.FormItemSet) ||
            api.ObjectHelper.iFrameSafeInstanceOf(container, api.form.FormOptionSet) ||
            api.ObjectHelper.iFrameSafeInstanceOf(container, api.form.FormOptionSetOption)) {
            formItems = container.getFormItems();
            formItems.forEach(formItem => {
                formItems = formItems.concat(this.getFormItems(formItem));
            });
        }

        return formItems;
    }

    private getFormInputs(): api.form.Input[] {
        const formItems = this.getFormItems(this.formView.getForm());
        return <api.form.Input[]>formItems.filter(formItem => api.ObjectHelper.iFrameSafeInstanceOf(formItem, api.form.Input));
    }

    private getNamesOfAllowedFields(): string[] {
        return this.getFormInputs()
            .filter(input => !this.isExcludedInputType(input.getInputType()))
            .map(formItem => formItem.getName());
    }

    private getFormValues(): string {
        const allowedFields = this.getNamesOfAllowedFields();

        const fieldDefinitions: string = allowedFields.map((fieldName: string) => {
            return `var ${_.camelCase(fieldName)} = ''; `;
        }).join('');

        const fieldAssignments: string =
            this.formView.getData().getValuesAsString()
                .filter(formValue => formValue.value.length > 0 && allowedFields.indexOf(formValue.name) > -1)
                .map(formValue => `${_.camelCase(formValue.name)} = '${this.sanitizeFieldValue(formValue.value)}'; `)
                .join('');

        return fieldDefinitions + fieldAssignments;
    }

    private safeEval(): string {
        const script = '"use strict";' +
            this.getFormValues() +
            '`' + this.expression + '`.trim().replace(/\\s+/g, \' \')';

        let result = '';

        try {
            result = eval(script);
        } catch (e) {
            console.error('Cannot evaluate script [' + script + '].', e);
        }

        return result;
    }
}
