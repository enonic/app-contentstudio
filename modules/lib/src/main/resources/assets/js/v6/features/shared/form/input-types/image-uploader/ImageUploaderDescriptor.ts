import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { InputConfigJson } from '@enonic/ui-types';
import type { ImageUploaderConfig } from './ImageUploaderConfig';

export const ImageUploaderDescriptor: InputTypeDescriptor<ImageUploaderConfig> = {
    name: 'ImageUploader' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(_raw: InputConfigJson): ImageUploaderConfig {
        return {};
    },

    createDefaultValue(_raw: unknown): Value {
        return ValueTypes.STRING.newNullValue();
    },

    validate(_value: Value, _config: ImageUploaderConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
