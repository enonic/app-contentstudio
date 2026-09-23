import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { type ContentSelectorConfig } from './ContentSelectorConfig';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { InputConfigJson } from '@enonic/ui-types';
import { SITE_PATH, readAllowPath } from '../../../../../shared/lib/form/form';

export const ContentSelectorDescriptor: InputTypeDescriptor<ContentSelectorConfig> = {
    name: 'ContentSelector' as const,

    getValueType(): ValueType {
        return ValueTypes.REFERENCE;
    },

    readConfig(raw: InputConfigJson): ContentSelectorConfig {
        const allowContentType = raw?.['allowContentType']?.map((cfg) => cfg['value'] as string).filter((val) => !!val);
        const allowPath = readAllowPath(raw, [SITE_PATH]);
        const treeMode = raw?.['treeMode']?.[0]?.value === true;
        const hideToggleIcon = raw?.['hideToggleIcon']?.[0]?.value === true;

        return {
            allowContentType,
            allowPath,
            treeMode,
            hideToggleIcon,
        };
    },

    createDefaultValue(raw: unknown): Value {
        return ValueTypes.REFERENCE.newNullValue();
    },

    validate(_value: Value, _config: ContentSelectorConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
