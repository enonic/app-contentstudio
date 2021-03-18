import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {Input} from 'lib-admin-ui/form/Input';
import {DisplayNameGenerator} from 'lib-admin-ui/app/wizard/DisplayNameGenerator';
import {FormView} from 'lib-admin-ui/form/FormView';
import {FormItem} from 'lib-admin-ui/form/FormItem';
import {Form} from 'lib-admin-ui/form/Form';
import {FieldSet} from 'lib-admin-ui/form/set/fieldset/FieldSet';
import {FormItemSet} from 'lib-admin-ui/form/set/itemset/FormItemSet';
import {FormOptionSet} from 'lib-admin-ui/form/set/optionset/FormOptionSet';
import {FormOptionSetOption} from 'lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {assertNotNull} from 'lib-admin-ui/util/Assert';
import {InputTypeName} from 'lib-admin-ui/form/InputTypeName';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import * as _ from 'lodash';

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

    private sanitiseValue(value: string) {
        let result = value;
        result = result.replace(/(<([^>]+)>)/ig,'');    // Strip HTML tags
        result = result.replace(/(\r\n|\n|\r)/gm,'');   // Strip linebreaks

        return result;
    }

    private isExcludedInputType(inputType: InputTypeName) {
        return this.excludedInputTypes.indexOf(inputType.getName().toLowerCase()) > -1;
    }

    private getFormItems(container: any): FormItem[] {
        let formItems = [];
        if (ObjectHelper.iFrameSafeInstanceOf(container, Form) ||
            ObjectHelper.iFrameSafeInstanceOf(container, FieldSet) ||
            ObjectHelper.iFrameSafeInstanceOf(container, FormItemSet) ||
            ObjectHelper.iFrameSafeInstanceOf(container, FormOptionSet) ||
            ObjectHelper.iFrameSafeInstanceOf(container, FormOptionSetOption)) {
            formItems = container.getFormItems();
            formItems.forEach(formItem => {
                formItems = formItems.concat(this.getFormItems(formItem));
            });
        }

        return formItems;
    }

    private getFormInputs(): Input[] {
        const formItems = this.getFormItems(this.formView.getForm());
        return <Input[]>formItems.filter(formItem => ObjectHelper.iFrameSafeInstanceOf(formItem, Input));
    }

    private getNamesOfAllowedFields(): string[] {
        return this.getFormInputs()
            .filter(input => !this.isExcludedInputType(input.getInputType()))
            .map(formItem => this.sanitiseName(formItem.getPath().toString().substr(1)));
    }

    private sanitiseName(name: string): string {
        return name
                .split('.')
                .map((namePart: string) => _.camelCase(namePart))
                .join('_');
    }

    private getFormValues(): string {
        const allowedFields = this.getNamesOfAllowedFields();

        const fieldDefinitions: string = allowedFields.map((fieldName: string) => {
            return `var ${fieldName} = ''; `;
        }).join('');

        const fieldAssignments: string =
            this.formView.getData().getValuesAsString()
                .filter(formValue => formValue.value.length > 0 && allowedFields.indexOf(this.sanitiseName(formValue.path)) > -1)
                .map(formValue => `${this.sanitiseName(formValue.path)} = '${this.sanitiseValue(formValue.value)}'; `)
                .join('');

        return fieldDefinitions + fieldAssignments;
    }

    private parseExpression(): string {
        let parsedExpression = this.expression;
        this.expression.match(/[^{}]+(?=\})/g).forEach(
            (variable: string) => parsedExpression = parsedExpression.replace(variable, this.sanitiseName(variable))
        );

        return parsedExpression;
    }


    private safeEval(): string {
        const script = '"use strict";' +
                       this.getFormValues() +
                       '`' + this.parseExpression() + '`.trim().replace(/\\s+/g, \' \')';

        let result = '';

        try {
            result = eval(script);
        } catch (e) {
            console.error('Cannot evaluate script [' + script + '].', e);
        }

        return result;
    }
}
