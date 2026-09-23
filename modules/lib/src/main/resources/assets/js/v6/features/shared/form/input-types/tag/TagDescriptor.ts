import type { Value } from '@enonic/input-types/data';
import type { ValueType } from '@enonic/input-types/data';
import type { InputConfigJson } from '@enonic/ui-types';
import {
    TagDescriptor as BaseTagDescriptor,
    type InputTypeDescriptor,
    type ValidationResult,
} from '@enonic/input-types';
import type { TagConfig } from './TagConfig';
import { readTagConfig } from './TagConfig';

export const TagDescriptor: InputTypeDescriptor<TagConfig> = {
    name: 'Tag',

    getValueType(): ValueType {
        return BaseTagDescriptor.getValueType();
    },

    readConfig(raw: InputConfigJson): TagConfig {
        return readTagConfig(raw);
    },

    createDefaultValue(raw: unknown): Value {
        return BaseTagDescriptor.createDefaultValue(raw);
    },

    validate(value: Value, config: TagConfig, rawValue?: string): ValidationResult[] {
        return BaseTagDescriptor.validate(value, config, rawValue);
    },

    valueBreaksRequired(value: Value): boolean {
        return BaseTagDescriptor.valueBreaksRequired(value);
    },
};
