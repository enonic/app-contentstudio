import {type Form} from '@enonic/lib-admin-ui/form/Form';
import {type FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {FieldSet} from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import {FormItemSet} from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import {FormOptionSet} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import {type PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {camelCase} from '../utils/format/camelCase';
import {instanceOf} from '../utils/object/instanceOf';

const EXCLUDED_INPUT_TYPES: readonly string[] = ['htmlarea'];

function sanitiseName(name: string): string {
    return name
        .split('.')
        .map((part) => camelCase(part))
        .join('_');
}

function sanitiseValue(value: string): string {
    return value
        .replace(/(<([^>]+)>)/gi, '')
        .replace(/(\r\n|\n|\r)/gm, '')
        .replace(/'/g, " '");
}

function isInput(item: FormItem): item is Input {
    return instanceOf(item, Input);
}

function collectInputs(items: FormItem[]): Input[] {
    return items.flatMap((item) => {
        if (isInput(item)) {
            return [item];
        }

        if (instanceOf(item, FieldSet) || instanceOf(item, FormItemSet)
            || instanceOf(item, FormOptionSet) || instanceOf(item, FormOptionSetOption)) {
            return collectInputs(item.getFormItems());
        }

        return [];
    });
}

function getAllowedFieldNames(form: Form): string[] {
    return collectInputs(form.getFormItems())
        .filter((input) => !EXCLUDED_INPUT_TYPES.includes(input.getInputType().getName().toLowerCase()))
        .map((input) => sanitiseName(input.getPath().toString().substring(1)));
}

function buildValueMap(data: PropertyTree, allowedFields: string[]): Map<string, string> {
    const map = new Map<string, string>();

    data.getRoot()
        .getValuesAsString()
        .filter((entry) => entry.value.length > 0 && allowedFields.includes(sanitiseName(entry.path)))
        .forEach((entry) => map.set(`\${${sanitiseName(entry.path)}}`, sanitiseValue(entry.value)));

    return map;
}

function parseExpression(expression: string): string {
    let parsed = expression;

    expression.match(/[^{}]+(?=\})/g)?.forEach((variable) => {
        parsed = parsed.replace(variable, sanitiseName(variable));
    });

    return parsed;
}

export function resolveDisplayNameExpression(expression: string, form: Form, data: PropertyTree): string {
    const valueMap = buildValueMap(data, getAllowedFieldNames(form));

    let result = parseExpression(expression);

    valueMap.forEach((value, placeholder) => {
        result = result.replace(placeholder, value);
    });

    return result
        .replace(/\$\{(.*?)\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
