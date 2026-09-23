import { type InputTypeDescriptor, type ValidationResult } from '@enonic/input-types';
import { validateForm } from '@enonic/input-types';
import { type SiteConfiguratorConfig } from './SiteConfiguratorConfig';
import { type ValueType } from '@enonic/input-types/data';
import { type Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import { ApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import type { InputConfigJson } from '@enonic/ui-types';
import { $applications } from '../../../../../entities/application';

export const SiteConfiguratorDescriptor: InputTypeDescriptor<SiteConfiguratorConfig> = {
    name: 'SiteConfigurator' as const,

    getValueType(): ValueType {
        return ValueTypes.DATA;
    },

    readConfig(_raw: InputConfigJson): SiteConfiguratorConfig {
        return {};
    },

    createDefaultValue(_raw: unknown): Value {
        return ValueTypes.DATA.newNullValue();
    },

    validate(value: Value, _config: SiteConfiguratorConfig): ValidationResult[] {
        if (value.isNull()) return [];

        const propertySet = value.getPropertySet();
        if (!propertySet) return [];

        const appKey = propertySet.getString(ApplicationConfig.PROPERTY_KEY);
        if (!appKey) return [];

        const app = $applications.get().applications.find((a) => a.getApplicationKey().toString() === appKey);
        const appForm = app?.getForm();
        if (!appForm || appForm.getFormItems().length === 0) return [];

        const configSet = propertySet.getPropertySet(ApplicationConfig.PROPERTY_CONFIG);
        if (!configSet) return [];

        const result = validateForm(appForm, configSet);
        if (!result.isValid) {
            return [{ message: i18n('field.siteConfig.invalid', app.getDisplayName() ?? appKey) }];
        }

        return [];
    },

    valueBreaksRequired(value: Value): boolean {
        return value.isNull();
    },
};
