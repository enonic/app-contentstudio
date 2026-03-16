import {InputTypeDescriptor, ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor';
import {ImageSelectorConfig} from './ImageSelectorConfig';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';

export const ImageSelectorDescriptor: InputTypeDescriptor<ImageSelectorConfig> = {
    name: 'ImageSelector' as const,

    getValueType(): ValueType {
        return ValueTypes.REFERENCE;
    },

    readConfig(raw: RawInputConfig): ImageSelectorConfig {
        return {
            allowPath: (raw?.['allowPath']?.[0]?.value as string[]) ?? ['${site}'],
            treeMode: raw?.['treeMode']?.[0]?.value === true,
            hideToggleIcon: raw?.['hideToggleIcon']?.[0]?.value === true,
        };
    },

    createDefaultValue(raw: unknown): Value {
        return ValueTypes.REFERENCE.newNullValue();
    },

    validate(_value: Value, _config: ImageSelectorConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
