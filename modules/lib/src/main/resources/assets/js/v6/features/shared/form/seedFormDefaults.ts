import { PropertyArray } from '@enonic/lib-admin-ui/data/PropertyArray';
import type { PropertySet } from '@enonic/lib-admin-ui/data/PropertySet';
import type { Value } from '@enonic/lib-admin-ui/data/Value';
import type { ValueType } from '@enonic/lib-admin-ui/data/ValueType';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import type { Form } from '@enonic/lib-admin-ui/form/Form';
import type { FormItem } from '@enonic/lib-admin-ui/form/FormItem';
import { Input } from '@enonic/lib-admin-ui/form/Input';
import { FieldSet } from '@enonic/lib-admin-ui/form/set/fieldset/FieldSet';
import { FormItemSet } from '@enonic/lib-admin-ui/form/set/itemset/FormItemSet';
import { FormOptionSet } from '@enonic/lib-admin-ui/form/set/optionset/FormOptionSet';
import { getEffectiveOccurrences, InputTypeRegistry } from '@enonic/lib-admin-ui/form2';
import type { InputTypeConfig } from '@enonic/lib-admin-ui/form2/descriptor/InputTypeConfig';
import type { InputTypeDescriptor } from '@enonic/lib-admin-ui/form2/descriptor/InputTypeDescriptor';
import { instanceOf } from '../../../shared/lib/object/instanceOf';
import { seedOptionSetDefaults } from './sets/option-set/seedOptionSetDefaults';

const SELECTED_NAME = '_selected';

/**
 * Populates `root` with a config form's default values, matching what the form2
 * FormRenderer writes on mount (FormItemRenderer / InputField / ItemSetView /
 * OptionSetView). Pre-seeding keeps the stored config in sync with the rendered
 * form, avoiding a reload loop (#9085).
 *
 * Expects a fresh `root`; existing arrays are left as-is.
 */
export function seedFormDefaults(form: Form, root: PropertySet): void {
    seedFormItems(form.getFormItems(), root);
}

function seedFormItems(items: FormItem[], propertySet: PropertySet): void {
    for (const item of items) {
        seedFormItem(item, propertySet);
    }
}

// Dispatch order mirrors FormItemRenderer / validateForm.
function seedFormItem(item: FormItem, propertySet: PropertySet): void {
    if (instanceOf(item, Input)) {
        seedInput(item, propertySet);
        return;
    }
    if (instanceOf(item, FieldSet)) {
        // Layout-only: children share the parent set.
        seedFormItems(item.getFormItems(), propertySet);
        return;
    }
    if (instanceOf(item, FormItemSet)) {
        seedItemSet(item, propertySet);
        return;
    }
    if (instanceOf(item, FormOptionSet)) {
        seedOptionSet(item, propertySet);
    }
    // Unknown types hold no data.
}

function seedInput(input: Input, propertySet: PropertySet): void {
    const definition = InputTypeRegistry.getDefinition(input.getInputType().getName());

    // No component → rendered as UnsupportedInput, seeds nothing.
    if (definition?.component == null) return;

    const { descriptor, mode } = definition;
    const config = descriptor.readConfig(input.getInputTypeConfig() ?? {});
    const occurrences = getEffectiveOccurrences(mode, input.getOccurrences());
    const propertyArray = getOrCreatePropertyArray(propertySet, input.getName(), descriptor.getValueType());

    const defaultValue = computeDefaultValue(input, descriptor, config);

    // internal-mode (selectors) aren't auto-seeded, but still seed a single configured default.
    const minFill = mode === 'internal' ? (defaultValue.isNull() ? 0 : 1) : Math.max(occurrences.getMinimum(), 1);
    if (minFill === 0) return;

    while (propertyArray.getSize() < minFill && !occurrences.maximumReached(propertyArray.getSize())) {
        propertyArray.add(defaultValue);
    }
}

function seedItemSet(itemSet: FormItemSet, propertySet: PropertySet): void {
    const occurrences = itemSet.getOccurrences();
    const propertyArray = getOrCreatePropertyArray(propertySet, itemSet.getName(), ValueTypes.DATA);
    const items = itemSet.getFormItems();

    // cf. useSetPropertyArray: fill to the minimum, then recurse into each occurrence.
    while (propertyArray.getSize() < occurrences.getMinimum()) {
        const occurrence = propertyArray.addSet();
        seedFormItems(items, occurrence);
    }
}

function seedOptionSet(optionSet: FormOptionSet, propertySet: PropertySet): void {
    const occurrences = optionSet.getOccurrences();
    const propertyArray = getOrCreatePropertyArray(propertySet, optionSet.getName(), ValueTypes.DATA);

    const isRadio = optionSet.isRadioSelection();
    const isLockedSingle = occurrences.getMinimum() === 1 && occurrences.getMaximum() === 1;

    // cf. OptionSetView: radio seeds occurrences only when locked single (min=max=1).
    if (isRadio && !isLockedSingle) return;

    while (propertyArray.getSize() < occurrences.getMinimum()) {
        const occurrence = propertyArray.addSet();
        seedOptionSetDefaults(optionSet, occurrence);
        seedSelectedOptionItems(optionSet, occurrence);
    }
}

function seedSelectedOptionItems(optionSet: FormOptionSet, occurrence: PropertySet): void {
    const selectedNames = readSelectedOptionNames(occurrence);
    if (selectedNames.length === 0) return;

    for (const option of optionSet.getOptions()) {
        if (!selectedNames.includes(option.getName())) continue;

        const items = option.getFormItems();
        if (items.length === 0) continue;

        // seedOptionSetDefaults created the selected option's set at index 0.
        const optionDataSet = occurrence.getPropertyArray(option.getName())?.getSet(0);
        if (optionDataSet == null) continue;

        seedFormItems(items, optionDataSet);
    }
}

function readSelectedOptionNames(occurrence: PropertySet): string[] {
    const selectedArray = occurrence.getPropertyArray(SELECTED_NAME);
    if (selectedArray == null) return [];

    const names: string[] = [];
    const size = selectedArray.getSize();
    for (let i = 0; i < size; i++) {
        const name = selectedArray.get(i)?.getValue().getString();
        if (name != null) names.push(name);
    }
    return names;
}

// Mirrors the defaultValue memo in form2 InputField.tsx — keep in sync.
function computeDefaultValue(input: Input, descriptor: InputTypeDescriptor, config: InputTypeConfig): Value {
    const raw = input.getInputTypeConfig()?.['default']?.[0]?.value;
    if (raw == null) return descriptor.getValueType().newNullValue();

    const value = descriptor.createDefaultValue(raw);
    if (value.isNull()) return descriptor.getValueType().newNullValue();
    if (descriptor.validate(value, config).length > 0) return descriptor.getValueType().newNullValue();

    return value;
}

function getOrCreatePropertyArray(propertySet: PropertySet, name: string, type: ValueType): PropertyArray {
    const existing = propertySet.getPropertyArray(name);
    if (existing != null) return existing;

    const created = PropertyArray.create().setName(name).setType(type).setParent(propertySet).build();
    propertySet.addPropertyArray(created);
    return created;
}
