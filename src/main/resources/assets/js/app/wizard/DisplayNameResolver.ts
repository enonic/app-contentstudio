import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {Input} from 'lib-admin-ui/form/Input';
import {DisplayNameGenerator} from 'lib-admin-ui/app/wizard/DisplayNameGenerator';
import {FormView} from 'lib-admin-ui/form/FormView';
import {assertNotNull} from 'lib-admin-ui/util/Assert';
import {InputTypeName} from 'lib-admin-ui/form/InputTypeName';

export class DisplayNameResolver
    implements DisplayNameGenerator {

    private formView: FormView;

    private expression: string;

    readonly excludedInputTypes: string[] = ['htmlarea'];

    setFormView(value: FormView): DisplayNameResolver {
        this.formView = value;
        return this;
    }

    setExpression(value: string): DisplayNameResolver {
        this.expression = value;
        return this;
    }

    hasExpression(): boolean {
        return !StringHelper.isBlank(this.expression);
    }

    execute(): string {
        assertNotNull(this.formView, 'formView not set');
        assertNotNull(this.expression, 'expression not set');

        return this.safeEval();
    }

    private sanitizeFieldValue(value: string) {
        let result = value;
        result = result.replace(/(<([^>]+)>)/ig,'');    // Strip HTML tags
        result = result.replace(/(\r\n|\n|\r)/gm,'');   // Strip linebreaks

        return result;
    }

    private isExcludedInputType(inputType: InputTypeName) {
        return this.excludedInputTypes.indexOf(inputType.getName().toLowerCase()) > -1;
    }

    private getNamesOfAllowedFields(): string[] {
        return this.formView.getForm().getFormItems()
            .filter(formItem => !this.isExcludedInputType((<Input>formItem).getInputType()))
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
