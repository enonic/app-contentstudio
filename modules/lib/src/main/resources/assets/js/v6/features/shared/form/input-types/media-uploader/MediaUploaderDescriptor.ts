import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { type MediaUploaderConfig } from './MediaUploaderConfig';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { InputConfigEntries } from '@enonic/input-types';
import type { FormScopeRequirement } from '../../FormScopeContext';

export const MediaUploaderDescriptor: InputTypeDescriptor<MediaUploaderConfig> = {
    name: 'MediaUploader' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: InputConfigEntries): MediaUploaderConfig {
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

/** What the input needs from the form scope; see `formScopeRequirements`. */
export const MEDIA_UPLOADER_SCOPE_REQUIREMENT: FormScopeRequirement = { project: true, content: true };
