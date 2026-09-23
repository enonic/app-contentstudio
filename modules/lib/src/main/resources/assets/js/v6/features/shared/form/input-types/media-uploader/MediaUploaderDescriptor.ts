import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { type MediaUploaderConfig } from './MediaUploaderConfig';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { InputConfigJson } from '@enonic/ui-types';

export const MediaUploaderDescriptor: InputTypeDescriptor<MediaUploaderConfig> = {
    name: 'MediaUploader' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: InputConfigJson): MediaUploaderConfig {
        return {
            hideDropZone: raw?.['hideDropZone']?.[0]?.value === true,
            allowExtensions:
                raw?.['allowExtensions']?.map((cfg) => ({
                    name: (cfg['name'] as string) ?? '',
                    extensions: (cfg['extensions'] as string) ?? '',
                })) ?? [],
        };
    },

    createDefaultValue(_raw: unknown): Value {
        return ValueTypes.STRING.newNullValue();
    },

    validate(_value: Value, _config: MediaUploaderConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
