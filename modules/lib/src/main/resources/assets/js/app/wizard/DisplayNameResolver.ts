import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {DisplayNameGenerator} from '@enonic/lib-admin-ui/app/wizard/DisplayNameGenerator';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {FormItem, FormItemParent} from '@enonic/lib-admin-ui/form/FormItem';
import {Form} from '@enonic/lib-admin-ui/form/Form';
import {FieldSet} from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import {FormItemSet} from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {InputTypeName} from '@enonic/lib-admin-ui/form/InputTypeName';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
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
        result = result.replace(/'/g, " '");

        return result;
    }

    private isExcludedInputType(inputType: InputTypeName) {
        return this.excludedInputTypes.indexOf(inputType.getName().toLowerCase()) > -1;
    }

    private getFormItems(container: Form | FormItemParent): FormItem[] {
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
        return formItems.filter(formItem => ObjectHelper.iFrameSafeInstanceOf(formItem, Input)) as Input[];
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

    private getExpressionValueMap(): Record<string, string> {
        const map = {};
        const allowedFields = this.getNamesOfAllowedFields();

        this.formView
            .getData()
            .getValuesAsString()
            .filter(formValue => formValue.value.length > 0 && allowedFields.indexOf(this.sanitiseName(formValue.path)) > -1)
            .forEach(formValue => map[`\$\{${this.sanitiseName(formValue.path)}}`] = this.sanitiseValue(formValue.value));

        return map;
    }

    private parseExpression(): string {
        let parsedExpression = this.expression;
        this.expression.match(/[^{}]+(?=\})/g)?.forEach(
            (variable: string) => parsedExpression = parsedExpression.replace(variable, this.sanitiseName(variable))
        );
        return parsedExpression;
    }


    private safeEval(): string {
        const parsedExpression = this.parseExpression();
        const expressionValueMap = this.getExpressionValueMap();
        let result = parsedExpression;

        Object.keys(expressionValueMap).forEach((expression) => {
            result = result.replace(expression, expressionValueMap[expression]);
        });

        return result
            .trim()
            .replace(/\$\{(.*?)\}/g, '')
            .replace(/\s+/g, ' ');
    }
}
