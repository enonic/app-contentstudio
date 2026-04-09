import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {type ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';
import type {InputTypeDescriptor} from '@enonic/lib-admin-ui/form2/descriptor/InputTypeDescriptor';
import type {ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor/ValidationResult';
import {isBlank} from '../../../../utils/format/isBlank';
import type {ContentTypeFilterConfig} from './ContentTypeFilterConfig';

export const ContentTypeFilterDescriptor: InputTypeDescriptor<ContentTypeFilterConfig> = {
    name: 'ContentTypeFilter' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: RawInputConfig): ContentTypeFilterConfig {
        return {context: raw?.['context']?.[0]?.value === true};
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') return ValueTypes.STRING.newNullValue();
        return ValueTypes.STRING.newValue(raw);
    },

    validate(_value: Value, _config: ContentTypeFilterConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) || isBlank(value.getString());
    },
};
