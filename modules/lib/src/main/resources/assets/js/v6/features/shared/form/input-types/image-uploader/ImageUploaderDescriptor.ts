import {type InputTypeDescriptor, type ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor';
import {type ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';
import type {ImageUploaderConfig} from './ImageUploaderConfig';

export const ImageUploaderDescriptor: InputTypeDescriptor<ImageUploaderConfig> = {
    name: 'ImageUploader' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(_raw: RawInputConfig): ImageUploaderConfig {
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
