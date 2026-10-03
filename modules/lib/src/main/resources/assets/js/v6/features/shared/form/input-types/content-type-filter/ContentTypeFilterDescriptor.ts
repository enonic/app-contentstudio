import { type Value } from '@enonic/input-types/data';
import { type ValueType } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { InputConfigEntries, InputTypeDescriptor } from '@enonic/input-types';
import type { ValidationResult } from '@enonic/input-types';
import { isBlank } from '../../../../../shared/lib/format/isBlank';
import type { ContentTypeFilterConfig } from './ContentTypeFilterConfig';

export const ContentTypeFilterDescriptor: InputTypeDescriptor<ContentTypeFilterConfig> = {
    name: 'ContentTypeFilter' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: InputConfigEntries): ContentTypeFilterConfig {
        return { context: raw?.['context']?.[0]?.value === true };
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
