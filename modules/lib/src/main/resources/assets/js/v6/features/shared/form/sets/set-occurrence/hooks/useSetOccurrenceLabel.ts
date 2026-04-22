import type {FormItem} from '@enonic/lib-admin-ui/form/FormItem';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {FormOptionSetOption} from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSetOption';
import type {Property} from '@enonic/lib-admin-ui/data/Property';
import type {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import type {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import type {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {useEffect, useState} from 'react';
import {instanceOf} from '../../../../../utils/object/instanceOf';

const ALLOWED_VALUE_TYPES: ValueType[] = [
    ValueTypes.STRING,
    ValueTypes.DOUBLE,
    ValueTypes.LONG,
    ValueTypes.LOCAL_DATE,
    ValueTypes.LOCAL_TIME,
];

export type SetOccurrenceLabel = {
    primary: string;
    secondary?: string;
};

/**
 * Derives the header label (primary + optional secondary) shown on a set
 * occurrence. Subscribes to property value/add/remove events on the occurrence
 * so the label stays in sync as the user edits nested fields. Exists because
 * labels must reflect live content, not just the form definition.
 */
export function useSetOccurrenceLabel(propertySet: PropertySet, formItems: FormItem[], fallbackLabel: string): SetOccurrenceLabel {
    const [label, setLabel] = useState(() => resolveLabel(propertySet, formItems, fallbackLabel));

    useEffect(() => {
        const update = () => setLabel(resolveLabel(propertySet, formItems, fallbackLabel));

        update();

        propertySet.onPropertyValueChanged(update);
        propertySet.onPropertyAdded(update);
        propertySet.onPropertyRemoved(update);

        return () => {
            propertySet.unPropertyValueChanged(update);
            propertySet.unPropertyAdded(update);
            propertySet.unPropertyRemoved(update);
        };
    }, [propertySet, formItems, fallbackLabel]);

    return label;
}

function isAllowedValueAndType(property: Property): boolean {
    if (property.getValue().isNull()) {
        return false;
    }

    const propertyType = property.getType();

    if (ValueTypes.LOCAL_TIME.equals(propertyType) && property.getString() === '00:00') {
        return false;
    }

    return ALLOWED_VALUE_TYPES.some((vt) => vt.equals(propertyType)) && property.getString().length > 0;
}

function sanitizeValue(value: string): string {
    return value
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&nbsp;/g, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/\n/g, ' ')
        .trim();
}

function isStringRecord(value: unknown): value is Record<string, string> {
    if (value == null || typeof value !== 'object') return false;
    return Object.values(value).every((v) => typeof v === 'string');
}

function getRadioButtonLabel(input: Input, selectedValue: string): string {
    const raw: unknown = input.getInputTypeConfig()?.['option'];
    if (!Array.isArray(raw)) return '';
    const options = raw.filter(isStringRecord);
    const selected = options.find((opt) => opt['@value'] === selectedValue);
    return selected?.['value'] ?? '';
}

function getPropertyValue(property: Property, formItem: FormItem): string {
    if (instanceOf(formItem, Input) && formItem.getInputType().toString() === 'RadioButton') {
        return getRadioButtonLabel(formItem, property.getString());
    }
    return property.getString();
}

function findFormItem(property: Property, formItems: FormItem[]): FormItem | undefined {
    const propName = property.getName();

    for (const item of formItems) {
        if (item.getName() === propName) {
            return item;
        }

        const children = item.getFormItems();
        if (children.length > 0) {
            const found = findFormItem(property, children);
            if (found) {
                return found;
            }
        }
    }

    return undefined;
}

function fetchPropertyValues(propArray: PropertyArray, formItems: FormItem[], propValues: string[], firstOnly: boolean): void {
    propArray.some((property) => {
        const formItem = findFormItem(property, formItems);
        if (!formItem) {
            return false;
        }

        if (isAllowedValueAndType(property)) {
            const value = sanitizeValue(getPropertyValue(property, formItem));
            if (value.length > 0) {
                propValues.push(value);
            }
        } else if (ValueTypes.DATA.equals(property.getType())) {
            const childSet = property.getPropertySet();
            childSet.getPropertyArrays().some((childArray) => {
                if (childArray.getName() === '_selected') {
                    return false;
                }
                fetchPropertyValues(childArray, formItems, propValues, firstOnly);
                return firstOnly && propValues.length > 0;
            });
        }

        return firstOnly && propValues.length > 0;
    });
}

function getFirstPropertyValue(propertySet: PropertySet, formItems: FormItem[]): string {
    const formItemNames = formItems.map((fi) => fi.getName());
    const selectedArray = propertySet.getPropertyArray('_selected');
    const isOptionSet = selectedArray != null;
    const selectedNames = new Set<string>();
    if (isOptionSet) {
        const size = selectedArray.getSize();
        for (let i = 0; i < size; i++) {
            const name = selectedArray.get(i)?.getValue().getString();
            if (name != null) selectedNames.add(name);
        }
    }

    const propArrays = propertySet
        .getPropertyArrays()
        .sort((a, b) => formItemNames.indexOf(a.getName()) - formItemNames.indexOf(b.getName()));

    const propValues: string[] = [];

    for (const propArray of propArrays) {
        const arrayName = propArray.getName();
        if (arrayName === '_selected') continue;
        if (isOptionSet && !selectedNames.has(arrayName)) continue;

        fetchPropertyValues(propArray, formItems, propValues, true);
        if (propValues.length > 0) {
            break;
        }
    }

    return propValues.length > 0 ? propValues.join(', ') : '';
}

function getSelectedOptionsLabel(propertySet: PropertySet, formItems: FormItem[]): string {
    const selectedArray = propertySet.getPropertyArray('_selected');
    if (selectedArray == null || selectedArray.getSize() === 0) {
        return '';
    }

    const labels: string[] = [];
    const size = selectedArray.getSize();
    for (let i = 0; i < size; i++) {
        const name = selectedArray.get(i)?.getValue().getString();
        if (name == null) continue;
        const option = formItems.find((fi) => fi.getName() === name);
        if (!instanceOf(option, FormOptionSetOption)) continue;
        const label = option.getLabel();
        if (label != null && label.length > 0) labels.push(label);
    }
    return labels.join(', ');
}

function resolveLabel(propertySet: PropertySet, formItems: FormItem[], fallbackLabel: string): SetOccurrenceLabel {
    const isOptionSet = propertySet.getPropertyArray('_selected') != null;
    const firstValue = getFirstPropertyValue(propertySet, formItems);

    if (!isOptionSet) {
        return {primary: firstValue || fallbackLabel};
    }

    const selectedOptions = getSelectedOptionsLabel(propertySet, formItems);
    return {
        primary: selectedOptions || fallbackLabel,
        secondary: selectedOptions ? firstValue : undefined,
    };
}
