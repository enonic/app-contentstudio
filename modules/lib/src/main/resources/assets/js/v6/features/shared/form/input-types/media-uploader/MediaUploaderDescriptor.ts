import { type InputTypeDescriptor, type ValidationResult } from '@enonic/lib-admin-ui/form2/descriptor';
import { type MediaUploaderConfig } from './MediaUploaderConfig';
import { type ValueType } from '@enonic/lib-admin-ui/data/ValueType';
import { type Value } from '@enonic/lib-admin-ui/data/Value';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import type { RawInputConfig } from '@enonic/lib-admin-ui/form/Input';

export const MediaUploaderDescriptor: InputTypeDescriptor<MediaUploaderConfig> = {
    name: 'MediaUploader' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: RawInputConfig): MediaUploaderConfig {
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
