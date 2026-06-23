import type {Value} from '@enonic/lib-admin-ui/data/Value';
import type {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';
import {TagDescriptor as BaseTagDescriptor, type InputTypeDescriptor, type ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor';
import type {TagConfig} from './TagConfig';
import {readTagConfig} from './TagConfig';

export const TagDescriptor: InputTypeDescriptor<TagConfig> = {
    name: 'Tag',

    getValueType(): ValueType {
        return BaseTagDescriptor.getValueType();
    },

    readConfig(raw: RawInputConfig): TagConfig {
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
