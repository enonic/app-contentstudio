import {type InputTypeDescriptor, type ValidationResult} from '@enonic/lib-admin-ui/form2/descriptor';
import {type ContentSelectorConfig} from './ContentSelectorConfig';
import {type ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {type Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {RawInputConfig} from '@enonic/lib-admin-ui/form/Input';
import {SITE_PATH} from '../../../../utils/form/form';

export const ContentSelectorDescriptor: InputTypeDescriptor<ContentSelectorConfig> = {
    name: 'ContentSelector' as const,

    getValueType(): ValueType {
        return ValueTypes.REFERENCE;
    },

    readConfig(raw: RawInputConfig): ContentSelectorConfig {
        const allowContentType = raw?.['allowContentType']?.map((cfg) => cfg['value'] as string).filter((val) => !!val);
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

    validate(_value: Value, _config: ContentSelectorConfig): ValidationResult[] {
        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
