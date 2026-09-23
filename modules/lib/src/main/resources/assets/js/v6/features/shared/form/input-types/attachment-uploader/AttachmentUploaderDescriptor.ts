import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { type AttachmentUploaderConfig } from './AttachmentUploaderConfig';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { InputConfigEntries } from '@enonic/input-types';

export const AttachmentUploaderDescriptor: InputTypeDescriptor<AttachmentUploaderConfig> = {
    name: 'AttachmentUploader' as const,

    getValueType(): ValueType {
        return ValueTypes.STRING;
    },

    readConfig(raw: InputConfigEntries): AttachmentUploaderConfig {
        return {
            hideDropZone: raw?.['hideDropZone']?.[0]?.value === true,
        };
    },

    createDefaultValue(_raw: unknown): Value {
        return ValueTypes.STRING.newNullValue();
    },

    validate(_value: Value, _config: AttachmentUploaderConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
