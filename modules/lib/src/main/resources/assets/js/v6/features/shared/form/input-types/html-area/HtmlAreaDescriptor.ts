import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {type ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';
import type {InputTypeDescriptor} from '@enonic/lib-admin-ui/form2/descriptor/InputTypeDescriptor';
import type {ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor/ValidationResult';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import type {HtmlAreaConfig} from './HtmlAreaConfig';

function parseTools(raw: RawInputConfig, key: string): string[] {
    const toolsObj = raw[key] as {value: string}[] | undefined;
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

    readConfig(raw: RawInputConfig): HtmlAreaConfig {
        return {
            enabledTools: parseTools(raw, 'include'),
            disabledTools: parseTools(raw, 'exclude'),
            allowedHeadings: (raw['allowHeadings']?.[0] as {value: string} | undefined)?.value ?? undefined,
        };
    },

    createDefaultValue(raw: unknown): Value {
        if (typeof raw !== 'string') {
            return ValueTypes.STRING.newNullValue();
        }
        return ValueTypes.STRING.newValue(raw);
    },

    validate(_value: Value, _config: HtmlAreaConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) || StringHelper.isBlank(value.getString());
    },
};
