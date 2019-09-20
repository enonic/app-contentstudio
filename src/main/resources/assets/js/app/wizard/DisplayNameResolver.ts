import '../../api.ts';

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

    private getNamesOfAllowedFields(): string[] {
        return this.formView.getForm().getFormItems()
            .filter(formItem => !this.isExcludedInputType((<api.form.Input>formItem).getInputType()))
            .map(formItem => formItem.getName());
    }

    private getFormValues(): string {
        const allowedFields = this.getNamesOfAllowedFields();
        return this.formView.getData().getStringValues()
            .map(formValue => {
                    const isAllowedField = allowedFields.indexOf(formValue.name) > -1;
                    return `var ${formValue.name} = '${isAllowedField ? this.sanitizeFieldValue(formValue.value): ''}'; `;
                }
            ).join('');
    }

    private safeEval(): string {
        const script = '"use strict";' +
                       this.getFormValues() +
                       '`' + this.expression + '`.replace(/\\s+/g, \' \')';

        let result = '';

        try {
            result = eval(script);
        } catch (e) {
            console.error('Cannot evaluate script [' + script + '].', e);
        }

        return result;
    }
}
