import { type Value } from '@enonic/input-types/data';
import { type ValueType } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { InputConfigEntries, InputTypeDescriptor } from '@enonic/input-types';
import type { ValidationResult } from '@enonic/input-types';
import { isBlank } from '../../../../../shared/lib/format/isBlank';
import type { HtmlAreaConfig } from './HtmlAreaConfig';

function parseTools(raw: InputConfigEntries, key: string): string[] {
    const toolsObj = raw[key] as { value: string }[] | undefined;
    const result: string[] = [];

    if (Array.isArray(toolsObj)) {
        for (const tool of toolsObj) {
            result.push(...tool.value.trim().split(/\s+/).filter(Boolean));
        }
    }

    return result;
}

export const HtmlAreaDescriptor: InputTypeDescriptor<HtmlAreaConfig> = {
    name: 'HtmlArea' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: InputConfigEntries): HtmlAreaConfig {
        return {
            enabledTools: parseTools(raw, 'include'),
            disabledTools: parseTools(raw, 'exclude'),
            allowedHeadings: (raw['allowHeadings']?.[0] as { value: string } | undefined)?.value,
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') return ValueTypes.STRING.newNullValue();
        return ValueTypes.STRING.newValue(raw);
    },

    validate(_value: Value, _config: HtmlAreaConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) || isBlank(value.getString());
    },
};
