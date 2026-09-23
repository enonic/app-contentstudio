import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { type ImageSelectorConfig } from './ImageSelectorConfig';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import { readAllowPath } from '../../../../../shared/lib/form/form';
import type { InputConfigEntries } from '@enonic/input-types';

export const ImageSelectorDescriptor: InputTypeDescriptor<ImageSelectorConfig> = {
    name: 'ImageSelector' as const,

    getValueType(): ValueType {
        return ValueTypes.REFERENCE;
    },

    readConfig(raw: InputConfigEntries): ImageSelectorConfig {
        const allowPath = readAllowPath(raw, []);
        const treeMode = raw?.['treeMode']?.[0]?.value === true;
        const hideToggleIcon = raw?.['hideToggleIcon']?.[0]?.value === true;

        return {
            allowPath,
            treeMode,
            hideToggleIcon,
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
