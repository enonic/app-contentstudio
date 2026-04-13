import {type InputTypeDescriptor, type ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor';
import {type CustomSelectorConfig} from './CustomSelectorConfig';
import {type ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';

export const CustomSelectorDescriptor: InputTypeDescriptor<CustomSelectorConfig> = {
    name: 'CustomSelector' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: RawInputConfig): CustomSelectorConfig {
        return {
            extension: raw?.['extension']?.[0]?.value as string,
            service: raw?.['service']?.[0]?.value as string,
            params: Object.entries((raw?.['params']?.[0]?.value || {}) as Record<string, string>).map(([key, value]) => ({
                label: key,
                value,
            })),
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
