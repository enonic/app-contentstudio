import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { type MediaSelectorConfig } from './MediaSelectorConfig';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { InputConfigJson } from '@enonic/ui-types';
import { readAllowPath } from '../../../../../shared/lib/form/form';

export const MediaSelectorDescriptor: InputTypeDescriptor<MediaSelectorConfig> = {
    name: 'MediaSelector' as const,

    getValueType(): ValueType {
        return ValueTypes.REFERENCE;
    },

    readConfig(raw: InputConfigJson): MediaSelectorConfig {
        const allowContentType = raw?.['allowContentType']
            ?.map((cfg) => cfg['value'] as string)
            .filter((val) => !!val && val.startsWith('media:'));
        const allowPath = readAllowPath(raw, []);
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

    validate(_value: Value, _config: MediaSelectorConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
