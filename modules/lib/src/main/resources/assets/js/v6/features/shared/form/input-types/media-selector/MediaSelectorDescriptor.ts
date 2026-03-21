import {type InputTypeDescriptor, type ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor';
import {type MediaSelectorConfig} from './MediaSelectorConfig';
import {type ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';
import {SITE_PATH} from '../../../../utils/form/form';

export const MediaSelectorDescriptor: InputTypeDescriptor<MediaSelectorConfig> = {
    name: 'MediaSelector' as const,

    getValueType(): ValueType {
        return ValueTypes.REFERENCE;
    },

    readConfig(raw: RawInputConfig): MediaSelectorConfig {
        const allowContentType = raw?.['allowContentType']
            ?.map((cfg) => cfg['value'] as string)
            .filter((val) => !!val && val.startsWith('media:'));
        const allowPath = raw?.['allowPath']?.map((cfg) => cfg['value'] as string).filter((val) => !!val) ?? [SITE_PATH];
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
