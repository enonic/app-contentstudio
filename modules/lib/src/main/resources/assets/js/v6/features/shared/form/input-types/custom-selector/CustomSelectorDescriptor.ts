import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { type CustomSelectorConfig } from './CustomSelectorConfig';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { InputConfigEntries } from '@enonic/input-types';

export const CustomSelectorDescriptor: InputTypeDescriptor<CustomSelectorConfig> = {
    name: 'CustomSelector' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: InputConfigEntries): CustomSelectorConfig {
        return {
            extension: raw?.['extension']?.[0]?.value as string,
            service: raw?.['service']?.[0]?.value as string,
            params: Object.entries((raw?.['params']?.[0]?.value || {}) as Record<string, string>).map(
                ([key, value]) => ({
                    label: key,
                    value,
                }),
            ),
            galleryMode: raw?.['galleryMode']?.[0]?.value === true,
        };
    },

    createDefaultValue(_raw: unknown): Value {
        return ValueTypes.STRING.newNullValue();
    },

    validate(_value: Value, _config: CustomSelectorConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
